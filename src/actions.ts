import { CompanionActionDefinition } from "@companion-module/base";
import { getOptions } from "./options";
import type { Instance } from "./index";

export enum ActionId {
    selectRoutine = "selectRoutine",
    selectSource = "selectSource",
    setLevel = "setLevel",
    changeLevel = "changeLevel",
}

export function getActions(instance: Instance): {
    [id in ActionId]: CompanionActionDefinition;
} {
    const options = getOptions(instance);
    return {
        [ActionId.selectRoutine]: {
            name: "Select routine",
            options: [options.routine],
            callback: (action): void => {
                instance.osc?.sendCommand(
                    "/oa/zone/routine/trigger",
                    action.options.routine as number
                );
            },
        },
        [ActionId.selectSource]: {
            name: "Select source",
            options: [options.zone, options.source],
            callback: (action): void => {
                instance.osc?.sendCommand(
                    `/oa/zone/set/zone/${action.options.zone}/source`,
                    Number(action.options.source)
                );
            },
        },
        [ActionId.setLevel]: {
            name: "Set level",
            options: [options.zone, options.levelItem, options.level],
            callback: (action): void => {
                instance.osc?.sendCommand(
                    `/oa/zone/set/zone/${action.options.zone}/level/${action.options.levelItem}`,
                    Number(action.options.level)
                );
            },
        },
        [ActionId.changeLevel]: {
            name: "Change level",
            options: [options.zone, options.levelItem, options.levelChange],
            callback: (action): void => {
                const address = `/oa/zone/set/zone/${action.options.zone}/level/${action.options.levelItem}`;

                /** Get current value */
                let value = Number(instance.oscValues[address]) || 0;
                value += Number(action.options.levelChange);

                value = Math.min(100, Math.max(0, value));

                instance.osc?.sendCommand(address, value);
            },
        },
    };
}
