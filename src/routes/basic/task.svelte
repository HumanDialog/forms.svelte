<script lang="ts">
    import {reef} from '@humandialog/auth.svelte'
	import  {RichEdit, 
            Page,
            Combo,
            ComboSource,
            DatePicker,
            editable,
			start_editing,
			activate_item,
			is_active,
			clear_active_item} from '$lib'
	import { onMount, tick } from 'svelte';
    import {querystring} from 'svelte-spa-router'
    import TaskSteps from './task.steps.svelte'
    import Tags from './tags.svelte'
    import {FaPlus,FaAlignLeft,FaCheck, FaTag,FaUser,FaCalendarAlt,FaUndo} from 'svelte-icons/fa/'

    
    let task: object = null;

    let global_tags = "#urgent:Crimson #server:CornflowerBlue #cloud:DarkSeaGreen #docs #samples #c++"

    onMount( async () =>
    {
        let params = new URLSearchParams($querystring);
        let task_ref = params.get('ref')
        let seg = task_ref?.split('/')
        let task_id = parseInt( seg[seg.length-1] )
        if(task_id == 1077936130)
        {
            task = {
                Id: task_id,
                $ref: task_ref,
                index: 'TSK-1243',
                title: "Interfejs zadania",
                summary: "Zadanie powinno wyglądać jak ładnie sformatowany dokument przy użyciu typografii. Tak jak właśnie wyświetlany rozdział.",
                tags: '#urgent #server #cloud',
                steps:[
                        { 
                            txt: "Zdefiniować style potrzebne w dokumencie opisującym zadanie",
                            checked: true
                        },
                        { 
                            txt: "Zaimplementować w svelte generowanie htmla definiującego zadanie",
                            checked: false
                        },
                        { 
                            txt: "Zaprojektować i zaimplementować działanie interfejsu zadania",
                            checked: false
                        }
                ],
                Responsible:{
                    $ref: './User/1077936130',
                    Name: 'Alice'
                },
                DueDate:'2024-03-20T08:00Z',
                OnList: null,
                description: `<p>Zadanie powinno mieć trzy pola tekstowe. Tytuł, Lead i Opis, przy czym tytuł
        miałby 64 znaki, lead 250 znaków a opis byłby nieograniczony i zawierałby w
        sobie możliwość formatowania. Ten akapit jest pierwszym akapitem opisu
        zadania. Tytuł jest na samej górze, potem atrybuty a potem kroki zadania. Na
        końcu dokument opisujący szczegółowo, co należy zrobić.</p>
    <h2>Dodawanie atrybutów do zadania</h2>
    <p>Na klawiaturze używamy klawisza '[' albo '\\' i mamy listę operacji dodających
        atrybuty: Dodaj Odpowiedzialnego, Dodaj datę, Dodaj Krok, Dodaj Załącznik,
        Dodaj opis. To samo uzyskujemy naciskając ikonkę [+].</p>
    <h2>Modyfikacja atrybutu</h2>
    <p>To już standardowo. Atrybut jest kontrolką.</p>
    <h2>Dokumenty zadania</h2>
    <p>Do zadania można dodać dowolną ilość dokumentów. Dokumenty wewnętrzne
        (HTML) mogą być dostępne jako kolejne akapity na interfejsie zadania. Można
        też zrobić ikonki [+] na rozwinięcie, [-] zwinięcie dokumentu tak jak zwijamy
        bloki w VSC.</p>`
            }   
        }
        else
        {
            let item = await reef.get(`${task_ref}?show_references`);
            item = item.Task
            task = {
                Id: item.Id,
                $ref: task_ref,
                index: `TSK-${task_id}`,
                title: item.Title,
                summary: item.Summary,
                tags: '',
                steps:[
                        
                ],
                Responsible: null,
                DueDate: item.DueDate,
                OnList: null,
                description: ''
            }   
        }
        return () => {}
    } 
    )

    function on_responsible_changed(key :string, name :string)
    {
        task.Responsible = {
            $ref: key,
            Name: name
        }
    }

    function on_list_changed(key :string, name :string)
    {
        task.OnList = {
            $ref: key,
            Name: name
        }
    }

    function on_date_changed(value)
    {
        if(!value)
            task.DueDate = "";    
        else
            task.DueDate = value.toJSON();
    }

    function on_title_changed(text)
    {
        task.title = text;
        console.log('on title changed:', text)
    }

    function on_summary_changed(text)
    {
        task.summary = text;
        console.log('on summary changed:', text)
    }

    function on_remove_tag(tag)
    {
        task.tags = task.tags.replace(`#${tag}`, '')
        console.log('on remove tag', tag)
    }

    function on_select_tag(tag)
    {
        task.tags += `#${tag} `
        console.log('on select tag', tag)
    }

    function on_create_tag(tag)
    {
        task.tags += `#${tag} `
        global_tags += `#${tag} `
        console.log('on create tag', tag)
    }

    function onAddStep(txt: string, beforeIdx: number|undefined)
    {
        if(beforeIdx >= task.steps.length)
            beforeIdx = undefined;

        const new_step = {txt: txt}
        if(beforeIdx == undefined)
            task.steps = [...task.steps, new_step]
        else
        {
            task.steps.splice(beforeIdx, 0, new_step);
            task.steps = [...task.steps]
        }
        
        console.log('onAddStep', txt, beforeIdx)
    }

    function onChangeStep(txt: string, idx: number)
    {
        task.steps[idx].txt = txt;
        console.log('onChangeStep', txt, idx)
    }

    function onRemoveStep(idx: number)
    {
        task.steps.splice(idx, 1)
        task.steps = [...task.steps]
        console.log('onRemoveStep', idx)
    }

    function get_page_operations_with_step_tools(step) 
    {
        let operations = [ 
            {
                icon: FaPlus,
                caption: '',
                grid: add_operations
            }
        ];

        if(step.checked)
        {
            operations.push(
                {
                    icon: FaUndo,
                    action: (f) => 
                    {  
                        step.checked = false
                        task.steps = [...task.steps]
                        activate_item('props', step, get_page_operations_with_step_tools(step))
                    }
                }
            )
        }
        else
        {
            operations.push(
                {
                    icon: FaCheck,
                    action: (f) => 
                    {  
                        step.checked = true
                        task.steps = [...task.steps]
                        activate_item('props', step, get_page_operations_with_step_tools(step))
                    }
                }
            )
        }

        return operations
    }
    function onSelectStep(idx: number)
    {
        let step = task.steps[idx];
        activate_item('props', step, get_page_operations_with_step_tools(step))
    }

    function onUnselectStep(idx: number)
    {
        let step = task.steps[idx];
        if(is_active('props', step))
            clear_active_item('props')
    }

    let summary;
    let summaryPlaceholder: boolean = false;
    
    let dueDate;
    let dueDatePlaceholder: boolean = false

    let onList;
    let onListPlaceholder: boolean = false

    let responsible;
    let responsiblePlaceholder: boolean = false

    let tags;
    let tagsPlaceholder: boolean = false

    let steps;
    let stepsPlaceholder: boolean = false;

    let description;
    let descriptionPlaceholder: boolean = false;
    
    let add_operations = [
        {
            caption: 'Summary',
            action: async (f) => 
                { 
                    if(summary)
                        summary.focus();
                    else
                    {
                        summaryPlaceholder = true;
                        await tick();
                        summary?.focus();
                    }
                }
        },
        {
            caption: 'List',
            action: async (f) => 
                {
                    if(onList)
                        onList.show();
                    else
                    {
                        onListPlaceholder = true;
                        await tick();
                        onList?.show(undefined, () => {onListPlaceholder = false})
                    }
                }
        },
        {
            caption: 'Due Date',
            icon: FaCalendarAlt,
            action: async (f) => 
                {
                    if(dueDate)
                        dueDate.show();
                    else
                    {
                        dueDatePlaceholder = true;
                        await tick();
                        dueDate?.show(undefined, () => {dueDatePlaceholder = false})
                    }
                }
        },
        {
            separator: true
        },
        {
            caption: 'Responsible',
            icon: FaUser,
            action: async (f) => 
                {
                    if(responsible)
                        responsible.show();
                    else
                    {
                        responsiblePlaceholder = true;
                        await tick();
                        responsible?.show(undefined, () => {responsiblePlaceholder = false})
                    }
                }
        },
        
        {
            caption: 'Tag',
            icon: FaTag,
            action: async (f) => 
                {
                    if(tags)
                        tags.show();
                    else
                    {
                        tagsPlaceholder = true;
                        await tick();
                        tags?.show(undefined, () => {tagsPlaceholder = false})
                    }
                }
        },
        {
            caption: 'Step',
            icon: FaCheck,
            action: async (f) => 
                {
                    if(steps)
                        steps.run();
                    else
                    {
                        stepsPlaceholder = true;
                        await tick();
                        steps?.run(steps.END_OF_LIST, '', () => {stepsPlaceholder = false})
                    }
                }
        },
        {
            separator: true
        },
        {
            caption: 'Description',
            icon: FaAlignLeft,
            action: async (f) => 
                {
                    if(description)
                        description.run();
                    else
                    {
                        descriptionPlaceholder = true;
                        await tick();
                        description?.run(() => {descriptionPlaceholder = false})
                    }
                }
        }
    ];
    
    const page_operations = [
        {
            icon: FaPlus,
            caption: '',
            grid: add_operations
        }
    ]

    function get_page_operations_with_formatting_tools() 
    {
        const add_operation = {
            icon: FaPlus,
            caption: '',
            grid: add_operations
        };

        const separator = {
            separator: true
        }

        const formatting_operations = description.get_formatting_operations();

        let operations = [add_operation, separator, ...formatting_operations]
        return operations
    }

    const description_active = { }
    function activate_formatting_tools(e)
    {
        console.log('activate_formatting_tools')
        activate_item('props', description_active, get_page_operations_with_formatting_tools())
    }

    function deactivate_formatting_tools_if_needed(e)
    {
        console.log('deactivate_formatting_tools_if_needed')
        
        if(is_active('props', description_active))
            clear_active_item('props')
    }

</script>

{#if task != null}

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex-->
<Page   self={task} 
            cl="!bg-white dark:!bg-slate-900 w-full h-full flex flex-col overflow-y-auto overflow-x-hidden py-1 px-1 border-0" 
            toolbar_operations={page_operations}
            clears_context=''
            title={task.title}>
    <section class="w-full flex justify-center">
        <article class="w-full prose prose-base prose-zinc dark:prose-invert">
            <section class="not-prose h-6 w-full flex flex-row justify-between mb-10">
                    <p class="text-xs mt-2">
                        {task.index}
                    </p>
                    <div>
                        {#if task.OnList || onListPlaceholder}
                            <Combo  compact={true} 
                                    in_context='data'
                                    a='OnList'
                                    is_association
                                    icon={false}
                                    placeholder='List'
                                    changed={(key,name)=>{on_list_changed(key, name)}}
                                    s='sm'
                                    bind:this={onList}>
                                <ComboSource    on_collect={() => reef.get('/app/Lists?fields=$ref,Name')} 
                                                key="$ref" 
                                                name='Name'/>
                            </Combo>
                        {/if}
                    </div>
                    <div>
                        {#if task.DueDate || dueDatePlaceholder}
                            <DatePicker     a='DueDate'
                                            compact={true}
                                            s="sm"
                                            in_context="data"
                                            changed={(value)=>{on_date_changed(value)}}
                                            bind:this={dueDate}
                                />
                        {/if}
                    </div>
            </section>

            <h1 use:editable={{
                        action: (text) => on_title_changed(text), 
                        active: true}}
                        tabindex="0">
                {task.title}
            </h1>
            
            {#if task.Responsible || responsiblePlaceholder || task.tags || tagsPlaceholder}
                <section class="not-prose h-6 w-full flex flex-row">
                    <div class="grow-0">
                        {#if task.Responsible || responsiblePlaceholder}
                            <Combo  compact={true} 
                                    in_context='data'
                                    a='Responsible'
                                    is_association
                                    icon={false}
                                    placeholder='Responsible'
                                    changed={(key,name)=>{on_responsible_changed(key, name)}}
                                    s='sm'
                                    bind:this={responsible}>
                                <ComboSource    on_collect={() => reef.get('/app/Users?fields=$ref,Name')} 
                                                key="$ref" 
                                                name='Name'/>
                            </Combo>
                        {/if}
                    </div>
                
                    {#if task.tags || tagsPlaceholder}
                        <Tags class="ml-auto grow justify-end"
                            tags={task.tags}
                            globalTags={global_tags}
                            onRemove={on_remove_tag}
                            onSelect={on_select_tag}
                            onCreate={on_create_tag}
                            bind:this={tags}/>
                    {/if}
                </section>
            {/if}
            
            {#if task.summary || summaryPlaceholder}
                {#key task.summary}
                    <p  class="mb-1" 
                        use:editable={{
                            action: (text) => on_summary_changed(text),
                            active: true}}
                        tabindex="0"
                        bind:this={summary}>
                        {task.summary}
                    </p>
                {/key}
                
            {/if}
            
            {#if (task.steps && task.steps.length > 0) || stepsPlaceholder}
                <TaskSteps steps={task.steps}
                                a='txt'
                                checkedAttribute='checked'
                                onRemove={onRemoveStep}
                                onAdd={onAddStep}
                                onChange={onChangeStep}
                                onSelect={onSelectStep}
                                onUnselect={onUnselectStep}
                                bind:this={steps}/>
            {/if}
                
            {#if task.description || descriptionPlaceholder}
                <RichEdit   a='description'
                            compact={true}
                            bind:this={description}
                            on:focus={activate_formatting_tools}
                            on:blur={deactivate_formatting_tools_if_needed}/>

            {/if}

        </article>
    </section>
</Page>
{/if}

