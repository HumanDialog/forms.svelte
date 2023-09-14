<script lang="ts">
    import {getContext} from 'svelte'
    import {rCombo_definition, rCombo_item} from './combo'

    export let key      :any | undefined = undefined;
    export let name     :string | undefined = undefined;
    export let avatar   :string | undefined = undefined;
    export let color    :string | undefined = undefined;

    let definition :rCombo_definition = getContext("rCombo-definition");
    let item = new rCombo_item;
    
    item.Name = name;
    item.Key = key;
    item.Avatar = avatar;
    item.Color = color;

    definition.source.push(item);
</script>