<script lang="ts">
    import {getContext} from 'svelte'
    import type{rKanban_definition} from './Kanban'
    import {contextItemsStore, contextTypesStore} from '../../stores'

    export let context:     string = ''
    export let objects:     object[] | undefined = undefined;
    export let self:        object | undefined = undefined;
    export let a:           string = '';
    export let key:         string = ''
    export let typename:    string = ''
    export let stateAttrib: string = ''
    export let orderAttrib: string = ''


    let  ctx   :string = context ? context : getContext('ctx');
    if(!self && ctx)         
        self = $contextItemsStore[ctx]
    
    if(!typename && ctx)
        typename = $contextTypesStore[ctx];


    let definition :rKanban_definition = getContext("rKanban-definition");
    
    definition.context = context;
    definition.objects = objects;
    definition.self = self;
    definition.a = a;
    definition.stateAttrib = stateAttrib;
    definition.orderAttrib = orderAttrib;
    definition.key = key;
    definition.typename = typename;

</script>