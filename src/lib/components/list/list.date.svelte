    <script lang="ts">
    import {getContext} from 'svelte'
    import {type rList_definition, rList_property_type, rList_property} from './List'

    export let name     :string;
    export let a        :string = '';
    export let onSelect = undefined;
    export let editable :boolean = true
    export let detailed: boolean = false
    export let prefix:  string = ''
    export let postfix: string = ''
    
    let definition :rList_definition = getContext("rList-definition");
    
    let date_property = new rList_property(rList_property_type.Date);
    date_property.name = name;
    
    date_property.a = a;
    if(!date_property.a)
        date_property.a = date_property.name;

    date_property.onSelect = onSelect
    date_property.readOnly = !editable
    date_property.detailed = detailed
    date_property.prefix = prefix
    date_property.postfix = postfix

    definition.properties.push(date_property)

</script>
