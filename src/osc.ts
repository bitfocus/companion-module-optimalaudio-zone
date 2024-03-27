// @ts-ignore
import osc from "osc";
import net from "net";
import { Instance } from "./index";
import { InstanceStatus } from "@companion-module/base";

export interface OscMessage {
    address: string;
    value: number | string | undefined;
}

const tooManyConnectionsMessage =
    "Exceeded the maximum number of connections to the Zone unit. Please close some connections or restart the unit.";

/**
 * Opens a TCP socket with the Zone unit and receives a stream of OSC messages.
 * The built-in TCP function in the Osc library does not support
 * the message length tag.
 */
export class Osc {
    client = new net.Socket();
    private buffer: Uint8Array = new Uint8Array(0);

    /** To prevent the .on('close') from overwriting our error message */
    hasSetError = false;

    retryTimeout: NodeJS.Timeout | null = null;
    updateInterfaceTimeout: NodeJS.Timeout | null = null;

    constructor(public instance: Instance) {
        this.connect();

        this.client.on("data", this.receiveData);

        this.client.on("ready", () => {
            this.instance.updateStatus(InstanceStatus.Ok);
        });

        this.client.on(
            "error",
            (err: { code: string; errno: number; syscall: string }) => {
                if (err.code === "ECONNRESET") {
                    this.instance.updateStatus(
                        InstanceStatus.ConnectionFailure,
                        tooManyConnectionsMessage,
                    );
                } else if (err.code === "ECONNREFUSED") {
                    this.instance.updateStatus(
                        InstanceStatus.ConnectionFailure,
                        "Please check that the device is turned on and that the address and port are correct.",
                    );
                } else {
                    this.instance.updateStatus(
                        InstanceStatus.ConnectionFailure,
                        err.code,
                    );
                }

                this.instance.log(
                    "error",
                    "Connection error: " + JSON.stringify(err),
                );

                this.hasSetError = true;
            },
        );

        this.client.on("close", () => {
            if (!this.hasSetError) {
                this.instance.updateStatus(InstanceStatus.Disconnected);
            }

            this.instance.log("error", "Connection closed.");

            this.retryTimeout && clearTimeout(this.retryTimeout);
            this.retryTimeout = setTimeout(() => {
                this.connect();
            }, 5000);
        });
    }

    connect = () => {
        this.retryTimeout && clearTimeout(this.retryTimeout);
        this.instance.updateStatus(InstanceStatus.Connecting);

        if (!this.instance.config.port || !this.instance.config.host) {
            this.instance.updateStatus(InstanceStatus.BadConfig);
            return;
        }

        this.client.connect(
            this.instance.config.port || 8001,
            this.instance.config.host || "127.0.0.1",
            () => {
                this.instance.log("info", "Connected to TCP OSC server");
                this.instance.updateStatus(InstanceStatus.Ok);
            },
        );
        this.hasSetError = false;
    };

    destroy = () => {
        this.retryTimeout && clearTimeout(this.retryTimeout);
        this.client.destroy();
    };

    /**
     * We receive a continuous stream of bytes on the form:
     *    [uint32 length][bytes OscMessage]
     * We split the stream into messages based on the specified length,
     * storing any incomplete messages in this.buffer.
     */
    receiveData = (data: Buffer) => {
        /**
         * Concatenate buffered bytes with new bytes.
         * Start by initializing a byte array with the correct length.
         */
        const bytes = new Uint8Array(this.buffer.length + data.length);
        bytes.set(this.buffer);
        /** Copy the old buffer into the new one */
        bytes.set(data, this.buffer.length);
        /** Append the new data */

        const dataView = new DataView(bytes.buffer);

        /** Read one message at a time */
        let offset = 0;
        while (offset + 4 < dataView.byteLength) {
            const lineLength = dataView.getInt32(offset, false);

            if (lineLength > 10_000) {
                // console.log(dataView.buffer.slice(offset));
                this.instance.log("error", "Malformed data received.");
                this.instance.updateStatus(InstanceStatus.UnknownError);

                /** Note: Errors are not caught by Companion! This stops execution */
                throw new Error(
                    "Malformed data received. Failed to decode line length.",
                );
            }

            if (offset + 4 + lineLength > dataView.byteLength) {
                /** We haven't received enough data */
                break;
            }
            offset += 4;
            /** The uint32 length descriptor is 4 bytes */
            const line = dataView.buffer.slice(offset, offset + lineLength);
            offset += lineLength;
            this.onMessage(this.parseOscLine(line));
        }

        /** What remains will be partial messages */
        this.buffer = new Uint8Array(dataView.buffer.slice(offset));
    };

    onMessage = ({ address, value }: OscMessage) => {
        this.instance.log("info", `OSC message received: ${address} ${value}`);

        if (address === "/oa/error") {
            if (value === "TOO_MANY_CONNECTIONS") {
                this.instance.updateStatus(
                    InstanceStatus.ConnectionFailure,
                    tooManyConnectionsMessage,
                );
                this.hasSetError = true;
            }
            return;
        }

        /** Handle deleted routines */
        if (address.startsWith("/oa/zone/set/name/routine_") && !value) {
            delete this.instance.oscValues[address];
        } else {
            this.instance.oscValues[address] = value;
        }

        this.updateInterfaceTimeout &&
            clearTimeout(this.updateInterfaceTimeout);
        this.updateInterfaceTimeout = setTimeout(() => {
            this.instance.updateInstance();
        }, 100);
    };

    sendCommand = (address: string, arg?: string | number): void => {
        this.instance.log("info", `sending ${JSON.stringify(address)} ${arg}`);

        /**
         * Optimistically save even before server has acknowledged.
         */
        this.instance.oscValues[address] = arg;
        this.instance.updateInstance();

        let args: { type: string; value: any }[] = [];
        if (typeof arg === "string") {
            args = [{ type: "s", value: arg }];
        } else if (typeof arg === "number") {
            args = [{ type: "f", value: arg }];
        }

        const buffer = osc.writeMessage({
            address,
            args,
        });
        const lengthBigEndian = Buffer.alloc(4);
        lengthBigEndian.writeUInt32BE(buffer.byteLength, 0);
        this.client.write(Buffer.concat([lengthBigEndian, buffer]));
    };

    parseOscLine = (buffer: ArrayBuffer): OscMessage => {
        const dataView = new DataView(buffer);
        /** Updated internally by the Osc library */
        const offsetState = {
            idx: 0,
        };
        const address: string = osc.readString(dataView, offsetState);
        const valueArr = osc.readArguments(dataView, {}, offsetState);
        let value: number | string | undefined;
        if (valueArr.length === 1) {
            value = valueArr[0];
        } else if (valueArr.length > 2) {
            this.instance.log(
                "error",
                "OSC messages with more than 2 arguments not currently supported",
            );
        }
        return {
            address,
            value,
        };
    };
}
