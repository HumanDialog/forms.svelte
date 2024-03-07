<script>
    import {    FaPlus,
                FaCaretUp,
                FaCaretDown} from 'svelte-icons/fa'

    import { context_items_store, page_toolbar_operations } from '$lib';
	import { onMount } from 'svelte';
    import Add from './add.svelte';

    let operations = [
            {
                icon: FaPlus,
                caption: '',
                menu: [
                    {
                        caption: 'Summary',
                        action: (focused) => {}
                    },
                    {
                        caption: 'Responsible',
                        icon: FaCaretUp,
                        action: (focused) => {}
                    },
                    {
                        caption: 'Due Date',
                        icon: FaCaretDown,
                        action: (focused) => {}
                    },
                    {
                        caption:'Submenu',
                        menu:[
                            {
                                caption: 'item 1',
                                action: (focused) => {}
                            },
                            {
                                caption: 'item 2',
                                action: (focused) => {}
                            },
                            {
                                caption: 'item 3',
                                menu:[
                                    {
                                        caption: 'leaf 1',
                                        action: (focused) => {}
                                    },
                                    {
                                        caption: 'leaf 2',
                                        action: (focused) => {}
                                    }
                                ]
                            },
                            {
                                caption: 'item 4',
                                action: (focused) => {}
                            }
                        ]
                    },
                    {
                        separator: true
                    },
                    {
                        caption: 'Task',
                        action: (focused) => {}
                    }
                ]
            },
            {
                icon: FaPlus,
                caption: '',
                toolbar: Add
            },
            {
                icon: FaPlus,
                caption: '',
                grid:[
                    {
                        caption: 'Summary',
                        action: (focused) => { console.log('add sumary')}
                    },
                    {
                        caption: 'Responsible',
                        icon: FaCaretUp,
                        action: (focused) => {}
                    },
                    {
                        caption: 'Due Date',
                        icon: FaCaretDown,
                        action: (focused) => {}
                    },
                    {
                        separator: true
                    },
                    {
                        caption: '#tag',
                        action: (focused) => {}
                    },
                    {
                        caption: 'Task',
                        columns: 2,
                        action: (focused) => {}
                    }
                ]
            },
            {
                caption: '',
                icon: FaCaretUp,
                action: (focused) => { console.log('focused:', focused) }
            },
            {
                caption: '',
                icon: FaCaretDown,
                action: (focused) => { console.log('focused:', focused) }
            }
    ];

    let focused_item = {

    }

    onMount(() => {
        $page_toolbar_operations = [...operations]

        $context_items_store['props'] = focused_item;
        $context_items_store.focused = 'props';
        $context_items_store = {...$context_items_store}

        return () => 
        {
            $page_toolbar_operations = []
        }
    })

</script>

<div class={$$props.class}>
    <a href="/" class="underline text-sm font-semibold ml-3"> &lt; Back to root</a>
</div>

