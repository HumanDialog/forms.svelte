<script lang="ts">
    import {getContext} from 'svelte'
    import {type rList_definition, rList_property_tags} from './List'

    export let name     :string = ''
    export let a        :string = ''
    export let prefix   :string = ''
    export let postfix  :string = ''
    export let readOnly: boolean = false

    export let getAllTags  :Function | undefined = undefined;
    export let onUpdateAllTags: Function | undefined = undefined;
    export let onSelect: Function | undefined = undefined;
    export let canChangeColor: boolean = false;
    
    let definition :rList_definition = getContext("rList-definition");
    
    let tags = new rList_property_tags;
   
    tags.prefix = prefix;
    tags.postfix = postfix;
    
    if(!a && name)
    {
        tags.a = name;
        tags.name = name;
    }
    else if(!name && a)
    {
        tags.a = a;
        tags.name = a;
    }
    else
    {
        tags.a = a;
        tags.name = name;
    }

    tags.onSelect = onSelect
    tags.onUpdateAllTags = onUpdateAllTags
    tags.canChangeColor = canChangeColor;
    tags.getAllTags = getAllTags
    tags.readOnly = readOnly

    definition.tags = tags

</script>
