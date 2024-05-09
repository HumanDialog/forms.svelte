<script lang="ts">

    export let brightntess: string = 'medium';
    export let onSelect: Function;
    
    $: colors = getColors(brightntess)

    function getColors(brightntess)
    {
        switch(brightntess)
        {
        case 'light':
            return [
                "bg-red-300",
                "bg-orange-300",
                "bg-amber-300",
                "bg-yellow-300",
                "bg-lime-300",
                "bg-green-300",
                "bg-indigo-300",
                "bg-blue-300",
                "bg-sky-300",
                "bg-cyan-300",
                "bg-teal-300",
                "bg-emerald-300",
                "bg-violet-300",
                "bg-purple-300",
                "bg-fuchsia-300",
                "bg-pink-300",
                "bg-rose-300",
                "bg-slate-300"
            ];

        case 'medium':
            return [
                    "bg-red-600",
                    "bg-orange-600",
                    "bg-amber-600",
                    "bg-yellow-600",
                    "bg-lime-600",
                    "bg-green-600",
                    "bg-indigo-600",
                    "bg-blue-600",
                    "bg-sky-600",
                    "bg-cyan-600",
                    "bg-teal-600",
                    "bg-emerald-600",
                    "bg-violet-600",
                    "bg-purple-600",
                    "bg-fuchsia-600",
                    "bg-pink-600",
                    "bg-rose-600",
                    "bg-slate-600"
                ];

        case 'dark':
            return [
                    "bg-red-800",
                    "bg-orange-800",
                    "bg-amber-800",
                    "bg-yellow-800",
                    "bg-lime-800",
                    "bg-green-800",
                    "bg-indigo-800",
                     "bg-blue-800",
                     "bg-sky-800",
                     "bg-cyan-800",
                     "bg-teal-800",
                     "bg-emerald-800",
                    "bg-violet-800",
                    "bg-purple-800",
                    "bg-fuchsia-800",
                    "bg-pink-800",
                    "bg-rose-800",
                    "bg-slate-800"
                ];
        }
    }

</script>

<menu class="grid grid-cols-6">
    {#each colors as color, idx}
        {@const isTL = idx == 0}
        {@const isTR = idx == 5}
        {@const isBL = idx == colors.length-6}
        {@const isBR = idx == colors.length-1}
        
        {@const borderTL = isTL ? "rounded-tl-lg": ""}
        {@const borderTR = isTR ? "rounded-tr-lg": ""}
        {@const borderBL = isBL ? "rounded-bl-lg": ""}
        {@const borderBR = isBR ? "rounded-br-lg": ""}
        
        <button class="{color} w-12 sm:w-10 h-12 sm:h-10 {borderTL} {borderTR} {borderBL} {borderBR}"
                on:click={() => onSelect(color)}>

        </button>
    {/each}

</menu>