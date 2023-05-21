import { CompanionFeedbackDefinition } from "@companion-module/base";

import type { Instance } from "./index";
import { getZones, sources } from "./options";
import { printLabel } from "./variables";

export enum FeedbackId {
    selectedSource = "selection_Method",
}

export function getFeedbacks(instance: Instance): {
    [id in FeedbackId]: CompanionFeedbackDefinition;
} {
    return {
        [FeedbackId.selectedSource]: {
            type: "boolean",
            name: "Selected source",
            defaultStyle: {
                text: "Source",
            },
            options: [
                {
                    type: "dropdown",
                    label: "Zone",
                    id: "zone",
                    default: 1,
                    choices: getZones(instance),
                },
                {
                    type: "dropdown",
                    label: "Source",
                    id: "source",
                    default: 1,
                    choices: [...sources].map(([value, label]) => ({
                        id: value,
                        label: printLabel(label),
                    })),
                },
            ],
            callback: (feedback) => {
                return (
                    instance.oscValues[
                        `/oa/zone/set/zone/${feedback.options.zone}/source`
                    ] === feedback.options.source
                );
            },
        },
    };
}
