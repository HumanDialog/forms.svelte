<script>
    import Layout from '$lib/desk.svelte'
    import {reef} from '@humandialog/auth.svelte'

    import Main from './main.svelte';
    import Red from './red.svelte';
    import Green from './green.svelte';
    import Blue from './blue.svelte';
    import Orange from './orange.svelte';
    import Nav from './nav.svelte'
    

    import {    FaRegCompass, 
                FaSearch, 
                FaDatabase} from 'svelte-icons/fa'

   

    reef.configure( { mode: 'dsabled'});

    const layout = {
                sidebar : {
                    'TOC': {
                        icon: FaRegCompass,
                        component: Nav
                    }/*,
                    'FIND':{
                        icon: FaSearch,
                        component: Green
                    },
                    'DB':{
                        icon: FaDatabase,
                        component: Blue
                    }*/
                },
                mainContent : {
                    component: Main
                },
                selectionDetails : { 
                    component: Orange
                },
                mainToolbar : {
                    signin: true
                },
                dark:
                {
                    optional: true,
                    default: true
                },
                operations:
                {
                    optional: false,
                    default: true
                }

    }


</script>

<Layout {layout}/>

