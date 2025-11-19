<script>
    import EditableSpan from './prose.editable.span.svelte'

    export let tooltip = ''
    export let val = ''
    export let invalid = false
    export let placeholder = ''
    export let required = false;
    export let readonly = false;
    export let multiline = false;
    export let validation = undefined;

    let userClass = $$restProps.class ?? '';

    let spanElement;

    export function setValue(v)
    {
        spanElement.setValue(v)
    }

    export function getValue()
    {
        return spanElement.getValue()
    }

    export function validate()
    {
        return spanElement.validate()
    }

    function onClick(e)
    {
        spanElement.runEditing(e)
    }

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-interactions -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex-->

<p class="cursor-text {userClass}"
    on:click={onClick}>
    <EditableSpan bind:this={spanElement}
        {tooltip}
        {val}
        {invalid}
        {placeholder}
        {required}
        {readonly}
        {multiline}
        {validation}
    />
</p>
