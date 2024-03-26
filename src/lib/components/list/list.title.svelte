<script lang="ts">
    import {getContext} from 'svelte'
    import type {rList_definition} from './List'
	
    export let a        :string;
    export let editable :boolean = false;
    export let on_change :Function | undefined = undefined; // function(element, text, property)
    export let readonly :boolean = false;
    export let href     :string | undefined = undefined
    export let href_func :Function | undefined = undefined

    
    let definition :rList_definition = getContext("rList-definition");
    
    definition.title=a;
    definition.title_editable=editable;
    definition.on_title_changed=on_change;
    definition.title_readonly = readonly;
    definition.title_href = href;
    definition.title_href_func = href_func;

</script>