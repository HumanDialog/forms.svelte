<script lang="ts">
    //import {Spinner} from 'flowbite-svelte'
    import { onMount } from 'svelte';

    export let color = 'blue';
    export let size = 8;

    export let delay :number = 1000;
    
    let user_class = $$props.class ?? "";

    const sizes = {
        1: "w-1 h-1",
        2: "w-2 h-2",
        3: "w-3 h-3",
        4: "w-4 h-4",
        5: "w-5 h-5",
        6: "w-6 h-6",
        7: "w-7 h-7",
        8: "w-8 h-8",
        9: "w-9 h-9",
        10: "w-10 h-10",
        11: "w-11 h-11",
        12: "w-12 h-12",
        14: "w-14 h-14",
        16: "w-16 h-16",
        20: "w-20 h-20",
        24: "w-24 h-24",
        28: "w-28 h-28",
        32: "w-32 h-32",
        36: "w-36 h-36",
        40: "w-40 h-40"
    }

    let iconsize = sizes[size];

    const colors = {
        blue: 'fill-blue-600',
        stone: 'fill-stone-600 dark:fill-stone-300',
        green: 'fill-green-500',
        red: 'fill-red-600',
        yellow: 'fill-yellow-400',
        pink: 'fill-pink-600',
        purple: 'fill-purple-600',
        white: 'fill-white'
    };

    let fillColorClass = colors[color];
    
    let visible = false;

    onMount(() => {
        
        visible = false;
        setTimeout( ()=> {
            visible = true;
        }, delay);
        return () => {}
    })

    

</script>


{#if visible}
    <svg
        role="status"
        class='inline -mt-px animate-spin dark:text-stone-600 {iconsize} text-stone-300 {fillColorClass} {user_class}'
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">

            <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor" />
            <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill" />
    </svg>
{/if}