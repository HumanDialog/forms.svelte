<script lang="ts">
    import {getContext} from 'svelte'
    import type {rList_definition} from './List'
	
    export let a        :string;
    export let editable :boolean = false;
    export let onChange :Function | undefined = undefined; // function(element, text, property)
    export let readonly :boolean = false;
    export let href     :string | undefined = undefined
    export let hrefFunc :Function | undefined = undefined

    
    let definition :rList_definition = getContext("rList-definition");
    
    definition.title=a;
    definition.title_editable=editable;
    definition.on_title_changed=onChange;
    definition.title_readonly = readonly;
    definition.title_href = href;
    definition.title_href_func = hrefFunc;

</script>