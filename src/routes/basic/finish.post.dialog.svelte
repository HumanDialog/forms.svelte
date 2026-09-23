<script>
    import {reef} from '@humandialog/auth.svelte'
    import {Dialog, i18n, Ricon} from '$lib'
    import {NS_SCRATCH, NR_SCRATCH, NK_COMMENT} from './consts'
    import {push} from 'svelte-spa-router'

    export let on_editor = false;

    export function show(n)
    {
        note = n

        switch(note.$type)
        {
        case 'FolderNote':
            note_nav = `${note.$ref}/Note`
            is_scratch = note.Role == NR_SCRATCH
            is_comment = note.Kind == NK_COMMENT
            break;

        case 'Note':
            note_nav = note.$ref
            is_scratch = note.State == NS_SCRATCH
            is_comment = note.Kind == NK_COMMENT
            break;
        }

        dialog.show()
    }

    export function close()
    {
        note = null
        note_nav = ''
        is_scratch = false
        dialog.hide()
    }

    export let on_refresh = undefined

    let note = null
    let note_nav = ''
    let is_scratch = false
    let is_comment = false
    let dialog


    const MWN_NOTHING = 0
    const MWN_FOCUS_CONTENT_END = 1
    const MWN_FOCUS_CONTENT_ALL = 2
    const MWN_INSERT_ATTACHEMENT = 3

    async function save_scratch_as_draft(note, action_after_redirecting=MWN_NOTHING)
    {
        if(!note)
            return;

        if(!note_nav)
            return;

        let working_post_content = ''
        if(note.Content)
        {
            working_post_content = note.Content.replace(/\r?\n/g, '<br>')
            working_post_content = `<p>${working_post_content}</p>`
        }
        

        let href = await reef.post(`${note_nav}/SaveScratchAsDraft`, {
            title: note.Title,
            summary: '',
            content: working_post_content
        })

        if(href)
        {
            let postfix = ''
            switch(action_after_redirecting)
            {
            case MWN_FOCUS_CONTENT_END:
                postfix = '?action=focuscontent&arg1=end'
                break;
            case MWN_FOCUS_CONTENT_ALL:
                postfix = '?action=focuscontent&arg1=all'
                break;
            case MWN_INSERT_ATTACHEMENT:
                postfix = '?action=insertattachement'
                break;
            }

            if(postfix)
                href += postfix
        }

        return href
    }

    async function go_to_post_editor() 
    {
        if(!note)
            return

        let href
        if(is_scratch)
            href = await save_scratch_as_draft(note, MWN_FOCUS_CONTENT_END)    
        else    
            href = note.href
        
        if(href)
            push(href)
    }

    async function save_as_draft()
    {
        if(!note)
            return

        if(is_scratch)
            await save_scratch_as_draft(note);
        close()

        if(on_refresh)
            on_refresh(note)
    }

    async function publish_thread()
    {
        if(!note)
            return

        if(!note_nav)
            return;

        const res = await reef.post(`${note_nav}/PublishThread`, {})
        if(!res)
            return

        close()

        if(on_refresh)
            on_refresh(note)
        
    }

    async function send_thread_as_confidential()
    {
        if(!note)
            return

        if(!note_nav)
            return

        const res = await reef.post(`${note_nav}/SendThreadAsConfidential`, {})
        if(!res)
            return

        close()

        if(on_refresh)
            on_refresh(note)
    }

    async function publish_comment()
    {
        if(!note)
            return

        if(!note_nav)
            return;

        const res = await reef.post(`${note_nav}/PublishComment`, {})
        if(!res)
            return

        close()

        if(on_refresh)
            on_refresh(note)
    }

</script>

<Dialog bind:this={dialog}>
    <div class="
                paper w-full
                prose prose-base prose-zinc dark:prose-invert prose-a:no-underline

                m-0 pt-5 pb-5 sm:px-8
                sm:rounded
                bg-stone-200 dark:bg-stone-900
                flex flex-col
                ">
            <!-------------------------------------------------------------------->
            <!-- POPUP HEADER ---------------------------------------------------->
            <!-------------------------------------------------------------------->
            <h3 class = "flex-none">
                <div class="w-full flex flex-row justify-between">
                    <div class="grow ">
                        <span>_; Finish the post; Terminar la entrada; Dokończ wpis</span>
                    </div>
                    <div class="py-1.5  flex flex-row justify-between">
                        <button class="ml-4 w-6
                                    hover:bg-stone-200 hover:dark:bg-stone-700
                                    hover:outline hover:outline-8
                                    hover:outline-stone-200 hover:dark:outline-stone-700"
                                    on:click={close}>
                            <Ricon icon = 'x' />
                        </button>
                    </div>
                </div>
            </h3>

            <!-------------------------------------------------------------------->
            <!-- POPUP CONTENT---------------------------------------------------->
            <!-------------------------------------------------------------------->
            <div class="grow max-h-[40dvh] sm:max-h-[75dvh] overflow-y-auto overscroll-contain">

                {#if !on_editor}
                <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                    <h4 >_; Editing; Editar; Edytowanie</h4>
                    <p>
                        _;
                        Open the enhanced post editor, which allows you to format content and add images and attachments.;
                        Abre el editor de entradas mejorado, que te permite dar formato al contenido y añadir imágenes y archivos adjuntos.;
                        Otwórz rozbudowany edytor wpisów, który umożliwia formatowanie treści oraz dodawanie obrazów i załączników.;
                    </p>

                    <div class="flex flex-row justify-center">
                        <button class="px-4 my-2 flex-none w-48
                                        bg-stone-100 dark:bg-stone-700
                                        border border-1
                                        border-stone-200 dark:border-stone-500
                                        hover:bg-stone-200 hover:dark:bg-stone-600"
                                        on:click={(e) => go_to_post_editor()}>
                                _; Go to the editor; Accede al editor; Wejdź do edytora
                        </button>
                    </div>
                </div>
                {/if}
                    
                {#if is_comment}
                    <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                        <h4 >_; Publishing; Editorial; Publikowanie</h4>
                        <p class="mr-4 ">
                            _;
                            Publish your comment so that it will be visible to everyone who can view the associated discussion.;
                            Publica tu comentario para que sea visible para todos los que puedan ver la discusión asociada.;
                            Opublikuj swój komentarz, aby był widoczny dla wszystkich osób mogących zobaczyć powiązaną dyskusję.;
                        </p>
                        <div class="flex flex-row justify-center">
                            <button class="px-4 my-2 flex-none w-48
                                            bg-stone-100 dark:bg-stone-700
                                            border border-1
                                            border-stone-200 dark:border-stone-500
                                            hover:bg-stone-200 hover:dark:bg-stone-600"
                                            on:click={(e) => publish_comment()}>
                                    _; Publish a comment; Publicar un comentario; Opublikuj komentarz
                            </button>
                        </div>
                    </div>
                {:else}
                    <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                        <h4 >_; Publishing; Editorial; Publikowanie</h4>
                        <p class="mr-4 ">
                            _;
                            Publish the post so that it's visible to all signed-in users. You can still edit it after publishing.;
                            Publica la entrada para que sea visible para todos los usuarios que hayan iniciado sesión. Podrás seguir editándola después de publicarla.;
                            Opublikuj wpis, aby był widoczny dla wszystkich zalogowanych użytkowników. Po opublikowaniu nadal możesz go edytować.;
                        </p>
                        <div class="flex flex-row justify-center">
                            <button class="px-4 my-2 flex-none w-48
                                            bg-stone-100 dark:bg-stone-700
                                            border border-1
                                            border-stone-200 dark:border-stone-500
                                            hover:bg-stone-200 hover:dark:bg-stone-600"
                                            on:click={(e) => publish_thread()}>
                                    _; Publish a post; Publicar entrada; Publikuj wpis
                            </button>
                        </div>
                    </div>
                    <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                        <h4 >_; Confidential; Confidencial; Poufne</h4>

                        <p class="mr-4 ">
                            _;
                            If you post a question confidentially, it will be visible only to you and the system administrator. Your post will not be visible to other users. Use this option if you need support but cannot disclose details about your work.;
                            Si publicas una pregunta de forma confidencial, solo podrás verla tú y el administrador del sistema. Tu publicación no será visible para el resto de usuarios. Utiliza esta opción si necesitas ayuda pero no puedes revelar detalles sobre tu trabajo.;
                            Jeśli opublikujesz pytanie jako poufne, będzie ono widoczne wyłącznie dla Ciebie i administratora systemu. Twój wpis nie będzie widoczny dla innych użytkowników. Skorzystaj z tej opcji, jeśli potrzebujesz pomocy, ale nie możesz ujawnić szczegółów dotyczących swojej pracy.;
                        </p>
                        <div class="flex flex-row justify-center">
                            <button class="px-4 my-2 flex-none w-48
                                            bg-stone-100 dark:bg-stone-700
                                            border border-1
                                            border-stone-200 dark:border-stone-500
                                            hover:bg-stone-200 hover:dark:bg-stone-600"
                                            on:click={(e) => send_thread_as_confidential()}>
                                    _; Send as confidential; Enviar como confidencial; Wyślij jako poufny
                            </button>
                        </div>
                    </div>

                    {#if is_scratch}

                        <div class="px-2 outline outline-4  bg-stone-100 outline-stone-100 dark:bg-stone-800 dark:outline-stone-800">
                        <h4 >_; Saving; Guardar; Zapisywanie</h4>

                                <p class="mr-4 ">
                                    _;
                                    Save this post as a draft. You'll be able to finish editing it later.;
                                    Guarda esta entrada como borrador. Podrás terminar de editarla más tarde.;
                                    Zapisz ten wpis jako wersję roboczą. Będziesz mógł dokończyć jego edycję później.;
                                </p>
                                <div class="flex flex-row justify-center">
                                    <button class="px-4 my-2 flex-none w-48
                                                    bg-stone-100 dark:bg-stone-700
                                                    border border-1
                                                    border-stone-200 dark:border-stone-500
                                                    hover:bg-stone-200 hover:dark:bg-stone-600"
                                                    on:click={(e) => save_as_draft()}>
                                            _; Save as draft; Guardar como borrador; Zapisz jako roboczy
                                    </button>
                                </div>
                        </div>
                    {/if}
                {/if}

                

            </div>
            <!-------------------------------------------------------------------->
            <!-- POPUP FOOTER----------------------------------------------------->
            <!-------------------------------------------------------------------->
            <h4 class = "flex-none">

                <div class="flex flex-row justify-end gap-2">

                    <button class="px-4 mx-2
                            bg-stone-100 dark:bg-stone-700
                            outline outline-offset-2 outline-2
                            outline-stone-200 dark:outline-stone-500
                            hover:bg-stone-200 hover:dark:bg-stone-700
                            "

                            on:click={close}> 
                            _; Cancel; Pegar; Anuluj
                    </button>
                </div>
            </h4>

        </div>
</Dialog>