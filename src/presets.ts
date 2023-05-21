import {
    combineRgb,
    CompanionButtonPresetDefinition,
    CompanionPresetDefinitions,
} from "@companion-module/base";
import { ActionId } from "./actions";
import { FeedbackId } from "./feedback";
import type { Instance } from "./index";
import {
    sources,
    getZones,
    getRoutines,
    levelItems,
    colors,
    getTextColorBasedOnBackground,
} from "./options";
import { printLabel } from "./variables";

interface CompanionPresetExt extends CompanionButtonPresetDefinition {
    feedbacks: Array<
        {
            feedbackId: FeedbackId;
        } & CompanionButtonPresetDefinition["feedbacks"][0]
    >;
    steps: Array<{
        down: Array<
            {
                actionId: ActionId;
            } & CompanionButtonPresetDefinition["steps"][0]["down"][0]
        >;
        up: Array<
            {
                actionId: ActionId;
            } & CompanionButtonPresetDefinition["steps"][0]["up"][0]
        >;
    }>;
}
interface CompanionPresetDefinitionsExt {
    [id: string]: CompanionPresetExt | undefined;
}

export function getPresetList(instance: Instance): CompanionPresetDefinitions {
    const presets: CompanionPresetDefinitionsExt = {};

    getZones(instance).forEach((zone) => {
        const color = colors[zone.id - 1].lighten(0.3);
        const selectedColor = colors[zone.id - 1].saturate(0.2);

        [...sources].forEach(([source, sourceType]) => {
            let label;
            if (sourceType === "local") {
                label = "Local Input";
            } else {
                label = `$(Zone:name_${sourceType})`;
            }

            const name = `zone_${zone.id}_select_source_${sourceType}`;
            presets[name] = {
                type: "button",
                category: "Zone Sources",
                name: name,
                style: {
                    text: `$(Zone:name_zone_${zone.id}): ${label}`,
                    size: "auto",
                    color: getTextColorBasedOnBackground(color),
                    bgcolor: color.rgbNumber(),
                },
                steps: [
                    {
                        down: [
                            {
                                actionId: ActionId.selectSource,
                                options: {
                                    zone: zone.id,
                                    source,
                                },
                            },
                        ],
                        up: [],
                    },
                ],
                feedbacks: [
                    {
                        feedbackId: FeedbackId.selectedSource,
                        options: {
                            zone: zone.id,
                            source: source,
                        },
                        style: {
                            color: getTextColorBasedOnBackground(color),
                            bgcolor: selectedColor.rgbNumber(),
                        },
                    },
                ],
            };
        });

        levelItems.forEach((levelItem) => {
            const increase = `zone_${zone.id}_increase_${levelItem}`;
            presets[increase] = {
                type: "button",
                category: "Zone Levels",
                name: increase,
                style: {
                    text: `⬆️ $(Zone:name_zone_${zone.id}): ${printLabel(
                        levelItem
                    )}`,
                    size: "auto",
                    color: getTextColorBasedOnBackground(color),
                    bgcolor: color.rgbNumber(),
                },
                steps: [
                    {
                        down: [
                            {
                                actionId: ActionId.changeLevel,
                                options: {
                                    zone: zone.id,
                                    levelItem,
                                    levelChange: 10,
                                },
                            },
                        ],
                        up: [],
                    },
                ],
                feedbacks: [],
            };

            const decrease = `zone_${zone.id}_decrease_${levelItem}`;
            presets[decrease] = {
                type: "button",
                category: "Zone Levels",
                name: decrease,
                style: {
                    text: `⬇️ $(Zone:name_zone_${zone.id}): ${printLabel(
                        levelItem
                    )}`,
                    size: "auto",
                    color: getTextColorBasedOnBackground(color),
                    bgcolor: color.rgbNumber(),
                },
                steps: [
                    {
                        down: [
                            {
                                actionId: ActionId.changeLevel,
                                options: {
                                    zone: zone.id,
                                    levelItem,
                                    levelChange: -10,
                                },
                            },
                        ],
                        up: [],
                    },
                ],
                feedbacks: [],
            };
        });
    });

    getRoutines(instance).forEach((routine) => {
        const name = `select_routine_${routine.id}`;
        presets[name] = {
            type: "button",
            category: "Routines",
            name: name,
            style: {
                text: `Routine: $(Zone:name_routine_${routine.id})`,
                size: "auto",
                color: combineRgb(0, 0, 0),
                bgcolor: combineRgb(230, 230, 230),
            },
            steps: [
                {
                    down: [
                        {
                            actionId: ActionId.selectRoutine,
                            options: {
                                routine: routine.id,
                            },
                        },
                    ],
                    up: [],
                },
            ],
            feedbacks: [],
        };
    });
    return presets;
}
