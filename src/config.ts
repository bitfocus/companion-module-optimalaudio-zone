import { Regex, SomeCompanionConfigField } from "@companion-module/base";

export interface Config {
    label: string;
    host: string;
    port: number;
}

export const configFields: SomeCompanionConfigField[] = [
    // {
    //     type: "static-text",
    //     width: 12,
    //     value: '',
    //     id: "info on license",
    //     label: "Important note",
    // },
    {
        type: "textinput",
        id: "host",
        label: "Target host",
        width: 6,
        default: "0.0.0.0",
        regex: Regex.IP,
    },
    {
        type: "number",
        id: "port",
        label: "Sending port",
        width: 6,
        default: 8001,
        min: 1,
        max: 65535,
        step: 1,
    },
];
