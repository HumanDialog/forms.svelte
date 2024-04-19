<script lang="ts">
    import {getContext} from 'svelte'
    import {type rKanban_definition, KanbanCardTop, KanbanCardMiddle, KanbanCardBottom} from './Kanban'
    import {rList_property_type, rList_property} from '../list/List'

    export let name     :string = '';
    export let a        :string = '';
    export let top:     boolean = false;
    export let middle:  boolean = true;
    export let bottom:  boolean = false;
    
    let definition :rKanban_definition = getContext("rKanban-definition");
    
    let date_property = new rList_property(rList_property_type.Static);
    
    if(!a && name)
    {
        date_property.a = name;
        date_property.name = name;
    }
    else if(!name && a)
    {
        date_property.a = a;
        date_property.name = a;
    }
    else
    {
        date_property.a = a;
        date_property.name = name;
    }

    if(top)
        date_property.position = KanbanCardTop;
    else if(bottom)
        date_property.position = KanbanCardBottom;
    else
        date_property.position = KanbanCardMiddle;

    definition.properties.push(date_property)

</script>