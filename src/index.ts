import {
    InstanceBase,
    runEntrypoint,
    SomeCompanionConfigField,
} from "@companion-module/base";
import { Config, configFields } from "./config";
import { getActions } from "./actions";
import { FeedbackId, getFeedbacks } from "./feedback";
import { getPresetList } from "./presets";
import { Variables } from "./variables";
import { Osc } from "./osc";

export class Instance extends InstanceBase<Config> {
    config: Config = {
        label: "",
        host: "",
        port: 0,
    };

    /**
     * A record of OSC values ([OSC address]: [value]) sent by the server.
     */
    oscValues: Record<string, string | number | undefined> = {};

    variables: Variables;
    osc?: Osc;

    constructor(internal: unknown) {
        super(internal);
        this.variables = new Variables(this);
        this.instanceOptions.disableVariableValidation = true;
    }

    async init(config: Config): Promise<void> {
        this.log("info", `Optimal Audio Zone module is being initialized`);
        void this.configUpdated(config);
    }

    async configUpdated(config: Config): Promise<void> {
        this.config = config;
        this.restartOsc(config);
        this.updateInstance();
    }

    getConfigFields(): SomeCompanionConfigField[] {
        return configFields;
    }

    async destroy() {
        this.log("info", `Instance destroyed: ${this.id}`);
        this.osc?.destroy();
    }

    restartOsc(config?: Config) {
        this.oscValues = {};
        this.osc?.destroy();
        if (config?.host) {
            this.osc = new Osc(this);
        }
    }

    updateInstance(): void {
        this.setVariableDefinitions(this.variables.variableDefinitions);
        this.setVariableValues(this.variables.variableValues);
        this.setActionDefinitions(getActions(this));
        this.setFeedbackDefinitions(getFeedbacks(this));
        this.setPresetDefinitions(getPresetList(this));

        this.checkFeedbacks(FeedbackId.selectedSource);
    }
}

runEntrypoint(Instance, []);
