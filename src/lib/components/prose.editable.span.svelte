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
        text = trim(text)
        
        val = text
        
        show_placeholder = can_show_placeholder()

        validate()
    }

    function onSingleChange(text)
    {
        /*if(!text)
        {
            text = '\u200B'
            val = text
        }
        else if(needTrim(text))
        {
            text = trim(text)
            val = text
        }
        */

        if(invalid)
            validate();
    }

    const whiteSpacePattern = /^[\s\u200B]+|[\s\u200B]+$/g;
    function needTrim(text)
    {
        return whiteSpacePattern.test(text);
    }

    function trim(text)
    {
        return text.replace(whiteSpacePattern, "");
    }

    let show_placeholder = can_show_placeholder()
    function can_show_placeholder()
    {
        if(!placeholder)
            return false

        if(val)
            return false

        return true
    }

    function focus(e)
    {
        //console.log('span focus')
        show_placeholder = false
    
    }

    function blur(e)
    {
        show_placeholder = can_show_placeholder()
       // console.log('span blur', show_placeholder)
    }
    
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-interactions -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex-->

<span class="{userClass} block w-full relative"
    
    title={tooltip}
    >

    {#if show_placeholder}
        <span class="text-zinc-600 dark:text-zinc-400 absolute top-0 left-0 w-full pointer-events-none"
                class:dark:!text-red-400={invalid}
                class:!text-red-600={invalid}>
            {placeholder}
        </span>
    {/if}

     <span  class="w-full inline-block" 
            class:text-red-500={invalid}
            bind:this={fieldElement}
            use:editable={{
                action: (text) => onFieldChanged(text), 
                active: true,
                onSingleChange: onSingleChange,
                enterAsNewLine: multiline,
                readonly: readonly}}
                on:focus={focus}
                on:blur={blur}
                tabindex="0">
        {#if val}
            {val}
        {:else}
            &ZeroWidthSpace;
        {/if}
    </span>
    
     

    <!--
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
    -->
        
</span>

