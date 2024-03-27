import {
    CompanionVariableDefinition,
    CompanionVariableValues,
} from "@companion-module/base";
import type { Instance } from "./index";

type VariableRecord = Record<
    string,
    | {
          name: string;
          value: string | number | undefined;
      }
    | {
          name: string;
          /** Will look up the value based on this OSC address */
          oscAddress: string;
      }
>;

export class Variables {
    constructor(public instance: Instance) {}

    private get variables(): VariableRecord {
        const variables: VariableRecord = {};

        Object.entries(this.instance.oscValues).forEach(([key, value]) => {
            if (key.startsWith("/oa/zone/set/name/")) {
                const label = key.replace("/oa/zone/set/name/", "");
                variables["name_" + label] = {
                    name: "Name: " + printLabel(label),
                    oscAddress: key,
                };
            } else if (key.startsWith("/oa/zone/set/")) {
                const label = key
                    .replace("/oa/zone/set/", "")
                    .replace(/\//g, "_");
                variables[label] = {
                    name: printLabel(label),
                    oscAddress: key,
                };
            } else if (key.startsWith("/oa/zone/status/")) {
                const label = key.replace("/oa/zone/status/", "");
                variables["status_" + label] = {
                    name: "Status: " + printLabel(label),
                    oscAddress: key,
                };
            }
        });

        return variables;
    }

    get variableValues(): CompanionVariableValues {
        return Object.entries(this.variables).reduce(
            (output, [key, variable]) => {
                if ("value" in variable) {
                    output[key] = variable.value;
                } else {
                    /** Round levels */
                    if (
                        variable.oscAddress.startsWith("/oa/zone/set/") &&
                        typeof this.instance.oscValues[variable.oscAddress] ===
                            "number"
                    ) {
                        output[key] = Math.round(
                            Math.round(
                                this.instance.oscValues[
                                    variable.oscAddress
                                ] as number,
                            ),
                        );
                    } else {
                        output[key] =
                            this.instance.oscValues[variable.oscAddress];
                    }
                }
                return output;
            },
            {} as CompanionVariableValues,
        );
    }

    get variableDefinitions(): CompanionVariableDefinition[] {
        return Object.entries(this.variables).map(([key, variable]) => {
            return {
                name: variable.name,
                variableId: key,
            };
        });
    }
}

export const ucfirst = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

export const printLabel = (str: string): string => {
    return ucfirst(str.replace(/_/g, " "));
};
