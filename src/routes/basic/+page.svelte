<script>
    import Layout from '$lib/desk.svelte'
    import {reef} from '@humandialog/auth.svelte'

    import Sidebar from './sidebar.svelte'
    import AppIcon from './appicon.svelte'
    
	import Tasklist from './tasklist.svelte';
    import Task from './task.svelte'
    import Board from './list.board.svelte';
    import MyTasks from './mytasks.svelte'
    import Members from './members.svelte'
    import Main from './main.svelte'

   

    reef.configure( {
            mode: 'local',
            local: {
                api:    "http://127.0.0.1:1996/",
                //api:    "http://192.168.0.102:1996/",
                users:
                [
                    "alice@example.com",
                    "bob@example.com"
                ],
                apiVersion: "v001"}
            });

    const layout = {
                sidebar : {
                    'TOC': {
                        icon: AppIcon,
                        component: Sidebar
                    }
                },
                mainContent : {
                    routes : {
                        '/' :           { component: Main},
                        '/tasklist':    { component: Tasklist},
                        '/tasklist/*':  { component: Tasklist},
                        '/task' :       { component: Task },
                        '/task/*' :     { component: Task },
                        '/listboard' :  { component: Board},
                        '/listboard/*' :  { component: Board},
                        '/mytasks' :    { component: MyTasks },
                        '/mytasks/*' :  { component: MyTasks },
                        '/members'   :  { component: Members }
                    }
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

