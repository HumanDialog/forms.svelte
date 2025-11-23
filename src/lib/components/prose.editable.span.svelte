<script>
    import {tick} from 'svelte'
    import {startEditing, editable} from '../utils'

    export let tooltip = ''
    export let val = ''
    export let invalid = false
    export let placeholder = ''
    export let required = false;
    export let readonly = false;
    export let multiline = false;
    export let validation = undefined;

    let userClass = $$restProps.class ?? '';

    export function setValue(v)
    {
        val = v;
    }

    export function getValue()
    {
        return val;
    }

    export function validate()
    {
        if(!validation)
        {
            if(required)
            {
                invalid = !val;
                return !invalid;   
            }
            else
            {
                invalid = false;
                return true;
            }
        }

        invalid = !validation(val);
        return !invalid;
    }

    let fieldElement
    let fieldPlaceholder = false
    export async function runEditing(e)
    {
        if(fieldElement)
            startEditing(fieldElement, () => fieldPlaceholder=false)
        else
        {
            fieldPlaceholder = true;
            await tick();
            startEditing(fieldElement, () => fieldPlaceholder=false)
        }
    }

    async function onFieldChanged(text)
    {
        if(text.startsWith('\u200B'))
            text = text.substring(1)
        
        val = text
        validate()
    }

    function onSingleChange(text)
    {
        if(!text)
            text = '\u200B'
        else if(text.startsWith('\u200B'))
            text = text.substring(1)
        
        val = text
        if(invalid)
            validate();
    }
    
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-interactions -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex-->

<span class="{userClass}"
    on:click={runEditing}
    title={tooltip}
    tabindex="0">
        {#if val || fieldPlaceholder}
            <span   class:text-red-500={invalid}
                    bind:this={fieldElement}
                    use:editable={{
                        action: (text) => onFieldChanged(text), 
                        active: false,
                        onSingleChange: onSingleChange,
                        enterAsNewLine: multiline,
                        readonly: readonly}}>
                {#if val}
                    {val}
                {:else}
                    &ZeroWidthSpace;
                {/if}
            </span>
        {:else if placeholder}
            <span class="text-zinc-600 dark:text-zinc-400"
                  class:dark:!text-red-400={invalid}
                  class:!text-red-600={invalid}>
                {placeholder}
            </span>
        {/if}
</span>

