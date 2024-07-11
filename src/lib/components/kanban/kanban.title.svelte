<script lang="ts">
    import {getContext} from 'svelte'
    import type {rKanban_definition} from './Kanban'

    export let a: string;
    export let onChange: Function | undefined = undefined
    export let readOnly: boolean = false;
    export let href     :string | undefined = undefined
    export let hrefFunc :Function | undefined = undefined
    export let hasAttachment :Function | undefined = undefined

    let definition :rKanban_definition = getContext("rKanban-definition");
    definition.titleAttrib = a;
    definition.titleOnChange = onChange;
    definition.titleReadOnly = readOnly;
    definition.titleHref = href;
    definition.titleHrefFunc = hrefFunc;
    definition.titleHasAttachment = hasAttachment;

</script>

