import {
    CompanionInputFieldNumber,
    CompanionInputFieldDropdown,
    DropdownChoice,
    combineRgb,
} from "@companion-module/base";
import { Instance } from "./index";
import { printLabel } from "./variables";
import Color from "color";

export interface Options {
    routine: CompanionInputFieldDropdown;
    zone: CompanionInputFieldDropdown;
    source: CompanionInputFieldDropdown;
    levelItem: CompanionInputFieldDropdown;
    level: CompanionInputFieldNumber;
    levelChange: CompanionInputFieldNumber;
}

export const colors: Color[] = [
    Color("#F94144"),
    Color("#F9C74F"),
    Color("#90BE6D"),
    Color("#43AA8B"),
    Color("#F3722C"),
    Color("#577590"),
    Color("#F9844A"),
    Color("#4D908E"),
    Color("#F8961E"),
    Color("#277DA1"),
];

export const getTextColorBasedOnBackground = (color: Color) => {
    return color.lighten(0.5).isDark()
        ? combineRgb(255, 255, 255)
        : combineRgb(0, 0, 0);
};

export const getOptions = (instance: Instance): Options => ({
    routine: {
        type: "dropdown",
        label: "Routine",
        id: "routine",
        default: 1,
        choices: getRoutines(instance),
    },
    zone: {
        type: "dropdown",
        label: "Zone",
        id: "zone",
        default: 1,
        choices: getZones(instance),
    },
    source: {
        type: "dropdown",
        label: "Source",
        id: "source",
        default: 1,
        choices: [...sources].map(([value, label]) => ({
            id: value,
            label: printLabel(label),
        })),
    },
    levelItem: {
        type: "dropdown",
        label: "Level Item",
        id: "levelItem",
        default: levelItems[0],
        choices: levelItems.map((levelItem) => ({
            id: levelItem,
            label: printLabel(levelItem),
        })),
    },
    level: {
        type: "number",
        label: "Level",
        id: "level",
        default: 50,
        step: 1,
        min: 0,
        max: 100,
        range: true,
    },
    levelChange: {
        type: "number",
        label: "Level Change",
        id: "levelChange",
        default: 5,
        step: 1,
        min: -100,
        max: 100,
        range: true,
    },
});

export const getZones = (instance: Instance): DropdownChoice[] => {
    const out: DropdownChoice[] = [];
    [1, 2, 3, 4, 5, 6, 7, 8].forEach((i) => {
        const name = instance.oscValues[`/oa/zone/set/name/zone_${i}`];
        if (name) {
            out.push({ id: i, label: name as string });
        }
    });
    return out;
};

export const getRoutines = (instance: Instance): DropdownChoice[] => {
    const out: DropdownChoice[] = [];
    Object.entries(instance.oscValues).forEach(([key, value]) => {
        if (!key.startsWith("/oa/zone/set/name/routine_")) return;
        const id = Number(key.replace("/oa/zone/set/name/routine_", ""));
        if (!id) return;
        out.push({ id, label: value as string });
    });
    return out;
};

export const levelItems = ["music", "mic", "system_mic_1", "system_mic_2"];

export const sources = new Map<number, string>([
    [1, "local"],
    [2, "line_in_1"],
    [3, "line_in_2"],
    [4, "line_in_3"],
    [5, "line_in_4"],
    [6, "hdmi_1"],
    [7, "hdmi_2"],
]);
