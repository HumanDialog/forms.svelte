<script lang="ts">
    import {editable, startEditing} from '$lib'
    
    export let onInsert;
    export function run(onClose, initialText='')
    {
        text = initialText;
        startEditing(insertionParagraph, onClose)
    }

    let insertionParagraph;
    let text;


</script>

<li class="mt-0 mb-0"
    bind:this={insertionParagraph}
    use:editable={onInsert}>
    {text}
</li>