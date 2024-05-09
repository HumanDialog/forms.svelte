<script lang="ts">
    import {getContext, setContext} from 'svelte'
    import {type rKanban_definition, KanbanCardTop, KanbanCardMiddle, KanbanCardBottom} from './Kanban'
    import {rList_property_combo} from '../list/List'
    import { type rCombo_definition } from '../combo/combo';

    export let name     :string = '';
    export let a        :string = '';
    export let onSelect = undefined;
    export let association :boolean = false;
    export let top:     boolean = false;
    export let middle:  boolean = true;
    export let bottom:  boolean = false;
    
    let definition :rKanban_definition = getContext("rKanban-definition");
    
    let combo_property = new rList_property_combo;

    if(!a && name)
    {
        combo_property.a = name;
        combo_property.name = name;
    }
    else if(!name && a)
    {
        combo_property.a = a;
        combo_property.name = a;
    }
    else
    {
        combo_property.a = a;
        combo_property.name = name;
    }

    combo_property.onSelect = onSelect
    combo_property.association = association;

    if(top)
        combo_property.position = KanbanCardTop;
    else if(bottom)
        combo_property.position = KanbanCardBottom;
    else
        combo_property.position = KanbanCardMiddle;

    definition.properties.push(combo_property)

    setContext('rCombo-definition', combo_property.combo_definition);

</script>

<slot/>
