<script lang="ts">
    import {getContext} from 'svelte'
    import {type rKanban_definition, KanbanCardTop, KanbanCardMiddle, KanbanCardBottom} from './Kanban'
    import {rList_property_tags} from '../list/List'

    export let name     :string='';
    export let a        :string = '';
    export let allTags  :string = '';
    export let onCreate: Function | undefined = undefined;
    export let onSelect: Function | undefined = undefined;
    
    export let top:     boolean = false;
    export let middle:  boolean = true;
    export let bottom:  boolean = false;
    
    let definition :rKanban_definition = getContext("rKanban-definition");
    
    let tagsProperty = new rList_property_tags;
    
    if(!a && name)
    {
        tagsProperty.a = name;
        tagsProperty.name = name;
    }
    else if(!name && a)
    {
        tagsProperty.a = a;
        tagsProperty.name = a;
    }
    else
    {
        tagsProperty.a = a;
        tagsProperty.name = name;
    }

    tagsProperty.onSelect = onSelect
    tagsProperty.onCreate = onCreate
    tagsProperty.allTags = allTags

    if(top)
        tagsProperty.position = KanbanCardTop;
    else if(bottom)
        tagsProperty.position = KanbanCardBottom;
    else
        tagsProperty.position = KanbanCardMiddle;

    definition.properties.push(tagsProperty)

</script>
