<script lang="ts">
    import {getContext, tick} from 'svelte'
    import type{rKanban_definition} from '../Kanban'
    import {rList_property_type} from '../../list/List'
    import Combo from '../../combo/combo.svelte'
    import DatePicker from '../../date.svelte'
    import Tags from '../../tags.svelte'
    
    export let position: number;
    export let item: object;

    let definition: rKanban_definition = getContext("rKanban-definition");
    let properties = definition.properties.filter(p => p.position == position);
    let propElements = [];
    let placeholder: string = ''
    
    export function editProperty(field :string)
    {
        let propIdx = properties.findIndex( p => p.name == field)
        if(propIdx < 0)
            return;

        let property = properties[propIdx];
        
        switch(property.type)
        {
        case rList_property_type.Date:
            editDate(field, propIdx);
            break;

        case rList_property_type.Combo:
            editCombo(field, propIdx);
            break;

        case rList_property_type.Tags:
            editTags(field, propIdx);
            break;
        }
    }

    function on_date_changed(value, a)
    {
        if(!value)
            item[a] = "";    
        else
            item[a] = value.toJSON();
    }

    function on_combo_changed(key, name, prop)
    {
        if(prop.association)
        {
            let iname = prop.combo_definition.element_name ?? '$display'
            item[prop.a] = {
                $ref: key,
                [iname]: name
            }
        }
        else
        {
            let value = key ?? name;
            item[prop.a] = value
        }
    }

    async function editCombo(field :string, propIdx :number)
    {
        let combo = propElements[propIdx];

        if(!!combo)
            combo.show();
        else
        {
            placeholder = field;
            await tick();
            combo = propElements[propIdx];
            if(!!combo)
                combo.show(undefined, () => {placeholder = ''});
        }
    }

    async function editDate(field :string, propIdx :number)
    {
        let combo = propElements[propIdx];

        //console.log('edit_propery', field, combo)

        if(!!combo)
            combo.show();
        else
        {
            placeholder = field;
            await tick();
            combo = propElements[propIdx];
            if(!!combo)
                combo.show(undefined, () => {placeholder = ''});
        }
    }

    async function editTags(field: string, propIdx: number)
    {
        let tags = propElements[propIdx]
        if(!!tags)
            tags.show();
        else
        {
            placeholder = field;
            await tick();
            tags = propElements[propIdx];
            if(!!tags)
                tags.show(undefined, () => {placeholder = ''});
        }
    }

    

</script>

<section class="flex flex-row justify-between">
    {#each properties as prop, idx}
        {#if item[prop.a] || placeholder==prop.name}
            {#if prop.type == rList_property_type.Date}
                <DatePicker
                    self={item}
                    a={prop.a}
                    compact={true}
                    s="xs"
                    inContext="props"
                    bind:this={propElements[idx]}/>
            {:else if prop.type == rList_property_type.Combo}
                <Combo
                        compact={true}
                        inContext="props"
                        self={item}
                        a={prop.a}
                        onSelect={prop.onSelect}
                        isAssociation={prop.association}
                        hasNone={prop.hasNone}
                        icon={false}
                        definition={prop.combo_definition}
                        s="xs"
                        changed={(k,n) => { /*fake assignment for component rer-ender*/ item[prop.a] = item[prop.a]; }} 
                        bind:this={propElements[idx]}/>
            {:else if prop.type == rList_property_type.Static}
                <p
                    class="     h-6
                                sm:text-xs sm:min-h-[1rem]
                                text-base min-h-[1.5rem]
                                text-stone-400
                                text-right"
                                bind:this={propElements[idx]}>
                    {item[prop.a]}
                </p>
            {:else if prop.type == rList_property_type.Tags}
                <Tags
                    class="mt-2"
                    compact
                    inContext="props"
                    self={item}
                    a={prop.a}
                    getGlobalTags={prop.getAllTags}
                    s="xs"
                    onSelect={prop.onSelect}
                    onUpdateAllTags={prop.onUpdateAllTags}
                    canChangeColor={prop.canChangeColor}
                    bind:this={propElements[idx]}
                />
            {/if}
        {/if}
    {/each}
</section>