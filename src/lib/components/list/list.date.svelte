<script lang="ts">
    import {getContext} from 'svelte'
    import {type rList_definition, rList_property_type, rList_property} from './List'

    export let name     :string;
    export let a        :string = '';
    export let on_select = undefined;
    
    let definition :rList_definition = getContext("rList-definition");
    
    let date_property = new rList_property(rList_property_type.Date);
    date_property.name = name;
    
    date_property.a = a;
    if(!date_property.a)
        date_property.a = date_property.name;

    date_property.on_select = on_select

    definition.properties.push(date_property)

</script>
