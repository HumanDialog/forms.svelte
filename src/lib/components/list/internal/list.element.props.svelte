<script lang="ts">
    import {tick} from 'svelte'
    import {rList_definition, rList_property_type} from '../List'
    import Combo from '../../combo/combo.svelte'
    import DatePicker from '../../date.svelte'

    export let definition   :rList_definition;
    export let item         :object;
    export let placeholder  :string = '';

    let props = []

    export function editProperty(field :string)
    {
        let prop_idx = definition.properties.findIndex( p => p.name == field)
        if(prop_idx < 0)
            return;

        let property = definition.properties[prop_idx];
        
        switch(property.type)
        {
        case rList_property_type.Date:
            edit_date(field, prop_idx);
            break;

        case rList_property_type.Combo:
            edit_combo(field, prop_idx);
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

    async function edit_combo(field :string, prop_idx :number)
    {
        let combo = props[prop_idx];

        if(!!combo)
            combo.show();
        else
        {
            placeholder = field;
            await tick();
            combo = props[prop_idx];
            if(!!combo)
                combo.show(undefined, () => {placeholder = ''});
        }
    }

    async function edit_date(field :string, prop_idx :number)
    {
        let combo = props[prop_idx];

        //console.log('edit_propery', field, combo)

        if(!!combo)
            combo.show();
        else
        {
            placeholder = field;
            await tick();
            combo = props[prop_idx];
            if(!!combo)
                combo.show(undefined, () => {placeholder = ''});
        }
    }

</script>

<div class="text-base grid-{definition.properties.length}">
    {#each definition.properties as prop, prop_index}
        <div class="col-span-1 w-full mr-auto mt-0.5">
            {#if item[prop.a] || placeholder == prop.name || prop.getter}
                <div role="gridcell" tabindex="0">
                    {#if prop.type == rList_property_type.Date}
                        {@const pickerType = prop.detailed ? 'datetime-local' : 'date'}
                        <DatePicker self={item} 
                                    a={prop.a}
                                    compact={true}
                                    onSelect={prop.onSelect}
                                    s="sm"
                                    inContext="props sel"
                                    bind:this={props[prop_index]}
                                    changed={(value)=>{on_date_changed(value, prop.a)}}
                                    readOnly={prop.readOnly}
                                    type={pickerType}
                        />
                    {:else if prop.type == rList_property_type.Combo}
                        <Combo  self={item} 
                                inContext="props sel" 
                                compact={true} 
                                a={prop.a}
                                onSelect={prop.onSelect}
                                isAssociation={prop.association}
                                hasNone={prop.hasNone}
                                icon={false} 
                                bind:this={props[prop_index]}
                                definition={prop.combo_definition}
                                changed={(key,name)=>{on_combo_changed(key, name, prop)}}
                                readOnly={prop.readOnly}
                                s="sm"/>
                    {:else if prop.type == rList_property_type.Static}
                        {@const value = prop.getter ? prop.getter(item) : item[prop.a]}
                        <p class="truncate text-sm">
                            {#if prop.prefix}
                                <span>{prop.prefix}</span>
                            {/if}

                            {value}

                            {#if prop.postfix}
                                <span>{prop.postfix}</span>
                            {/if}

                        </p>
                    {/if}

                    </div>
            {/if}
            </div>
    {/each}
</div>

<style>
    .grid-1
    {
        display: grid;
        grid-template-columns: 100%;
    }

    .grid-2
    {
        display: grid;
        grid-template-columns: 50% 50%;
    }

    .grid-3
    {
        display: grid;
        grid-template-columns: 33% 33% 33%;
    }

    .grid-4
    {
        display: grid;
        grid-template-columns: 25% 25% 25% 25%;
    }

</style>