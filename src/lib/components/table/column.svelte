<script lang="ts">
    import {getContext, setContext} from 'svelte'
    import {rTable_definition, rTable_column} from './table'

    export let header   :string  = '';
    export let field    :string = '';
    export let size     :number = 0;
    
    let table_definition :rTable_definition = null;
    table_definition = getContext('rTable-definition');
    
    let col :rTable_column = new rTable_column;
    col.field = field;
    col.header = header;
    col.size = size;
    if($$restProps['class'])
        col.cl = $$restProps['class'];

    table_definition.columns.push(col);
    
    
</script>


