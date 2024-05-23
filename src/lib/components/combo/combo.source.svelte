<script lang="ts">
    import {getContext} from 'svelte'
    import type {rCombo_definition} from './combo'

    export let association :string | undefined = undefined;
    export let path :string | undefined = undefined;
    export let objects :object[] | undefined = undefined;
    export let onCollect = undefined;

    export let key :string = '';
    export let name :string = ''; 
    export let avatar :string = '';
    export let icon :string = '';

    let definition :rCombo_definition = getContext("rCombo-definition");

    definition.collection_expr = association;
    definition.collection_path = path;
    definition.collection = objects;
    definition.onCollect = onCollect;
    definition.element_key = key;
    definition.element_name = name;
    definition.element_avatar = avatar;
    definition.element_icon = icon;

    

</script>
