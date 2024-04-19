<script lang="ts">
    import {getContext} from 'svelte'
    import {type rKanban_definition, rKanban_column} from './Kanban'

    export let title:      string = '';
    export let width:      string = 'w-[240px]';
    export let state:      any = ''
    export let finishing:  boolean = false;
    export let operations: object[]|undefined = undefined;
    export let onTitleChanged: Function|undefined = undefined;

    let definition :rKanban_definition = getContext("rKanban-definition");

    let column :rKanban_column = new rKanban_column;
    column.id = definition.columns.length + 1
    column.title = title;
    column.width = width;
    column.state = state;
    column.finishing = finishing;
    column.operations = operations;
    column.onTitleChanged = onTitleChanged;
    
    definition.columns.push(column)

</script>

