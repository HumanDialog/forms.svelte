<script lang="ts">
    import {getContext} from 'svelte'
    import {type rKanban_definition, rKanban_column} from './Kanban'

    export let title:      string = '';
    export let width:      string = 'w-[240px]';
    export let self:       object|undefined = undefined;
    export let a:          string = '';
    export let objects:    object[]|undefined = undefined;
    export let context:    string = ''

    let definition :rKanban_definition = getContext("rKanban-definition");

    let column :rKanban_column = new rKanban_column;
    column.id = definition.columns.length + 1
    column.title = title;
    column.width = width;
    column.self = self;
    column.a = a;
    column.objects = objects;
    column.context = context;

    definition.columns.push(column)

</script>

