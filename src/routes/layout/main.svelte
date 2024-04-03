<script>
    import {    FaPlus,
                FaCaretUp,
                FaCaretDown} from 'svelte-icons/fa'

    import { contextItemsStore, pageToolbarOperations } from '$lib';
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
        $pageToolbarOperations = [...operations]

        $contextItemsStore['props'] = focused_item;
        $contextItemsStore.focused = 'props';
        $contextItemsStore = {...$contextItemsStore}

        return () => 
        {
            $pageToolbarOperations = []
        }
    })

</script>


    <div class={$$props.class}>
        <a href="/" class="underline text-sm font-semibold ml-3"> &lt; Back to root</a>
    </div>

    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas venenatis pretium accumsan. Nam condimentum risus sed dui pharetra efficitur. Mauris sodales vehicula luctus. Mauris rhoncus lacinia felis molestie aliquam. Pellentesque sed arcu a leo posuere condimentum at vel dolor. Sed ultrices dolor purus, dapibus hendrerit lectus tristique ultrices. Nulla feugiat lorem turpis, at laoreet arcu lobortis ut. Nunc ultricies rutrum nunc et porta.</p>
    <p>Suspendisse accumsan ex eget quam pretium consectetur. Curabitur feugiat quam vitae justo feugiat fringilla. Duis euismod nisi id consequat vulputate. Maecenas sodales, orci nec euismod dapibus, urna justo venenatis lacus, sit amet luctus ante ligula at metus. Nulla vestibulum diam eu faucibus accumsan. Suspendisse potenti. Maecenas consectetur turpis et libero consequat condimentum. Duis justo dui, vestibulum a vehicula a, iaculis non tortor. Aenean lectus nisi, ultricies id interdum at, mattis sit amet sapien. Aenean feugiat congue est, at semper dui tincidunt a. Sed tortor elit, interdum sit amet tellus ut, lacinia ornare ipsum. Quisque dictum odio ut turpis malesuada ullamcorper. Vestibulum imperdiet, mi nec varius vulputate, augue augue egestas lectus, ut ultricies ligula ipsum et felis. Cras laoreet mi nisi. Morbi vulputate nunc in luctus malesuada. Phasellus at semper mauris.</p>
    <p>In maximus quis purus sed elementum. Aliquam eget aliquam tortor. Nulla facilisi. Suspendisse lectus neque, maximus quis nisi eget, pellentesque luctus ante. Nulla molestie, sem tristique finibus dignissim, orci dui ornare diam, eget ullamcorper diam lacus non lacus. Fusce molestie ex urna, quis tincidunt tellus convallis ac. Phasellus fringilla ligula mi, in dapibus nunc pretium sed. Pellentesque eu elit vel elit ullamcorper vehicula sed ut dui. Duis sed leo at neque sollicitudin commodo in eleifend turpis. Vestibulum vel lectus pharetra, varius justo vitae, mollis tortor. Fusce venenatis nibh eu efficitur tincidunt. Vestibulum nec fermentum ipsum. Duis non congue velit.</p>
