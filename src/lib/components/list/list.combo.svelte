<script lang="ts">
    import {getContext, setContext} from 'svelte'
    import {type rList_definition, rList_property_combo} from './List'
    import { type rCombo_definition } from '../combo/combo';

    export let name     :string;
    export let a        :string = '';
    export let onSelect = undefined;
    export let association :boolean = false;
    export let hasNone:     boolean = association;
    
    let definition :rList_definition = getContext("rList-definition");
    
    let combo_property = new rList_property_combo;
    combo_property.name = name;
    
    combo_property.a = a;
    if(!combo_property.a)
        combo_property.a = combo_property.name;

    combo_property.onSelect = onSelect
    combo_property.association = association;
    combo_property.hasNone = hasNone;

    definition.properties.push(combo_property)

    setContext('rCombo-definition', combo_property.combo_definition);

</script>

<slot/>
