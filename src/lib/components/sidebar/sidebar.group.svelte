<script>
    export let border = false;

    let border_class = border ? " pt-4 mt-4 border-t border-stone-200 dark:border-stone-700" : ""
</script>

<ul class="space-y-2 {border_class}">
    <slot/>
</ul>