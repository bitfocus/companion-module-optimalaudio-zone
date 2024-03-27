import { SomeCompanionConfigField } from "@companion-module/base";

export interface Config {
    label: string;
    host: string;
    port: number;
}

export const configFields: SomeCompanionConfigField[] = [
    {
        type: "textinput",
        id: "host",
        label: "Host (IP address or mDNS name)",
        width: 6,
        default: "optimalaudio.local",
    },
    {
        type: "number",
        id: "port",
        label: "Port",
        width: 6,
        default: 8000,
        min: 1,
        max: 65535,
        step: 1,
    },
];
