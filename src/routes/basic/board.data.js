export let global_tags = "#urgent:Crimson #server:CornflowerBlue #cloud:DarkSeaGreen #docs #samples #c++"

export let list = {
    allTasks:[
        {
            Id: 1,
            $ref: './Task/1',
            index: 'TSK-1243',
            title: "Interfejs zadania",
            summary: "Zadanie powinno wyglądać jak ładnie sformatowany dokument przy użyciu typografii. Tak jak właśnie wyświetlany rozdział.",
            tags: '#urgent #server #cloud #docs #samples #c++',
            Responsible:{
                $ref: './User/1077936130',
                Name: 'Alice'
            },
            DueDate:'2024-03-20T08:00Z',
            Phase: 1
        },

        {
            Id: 2,
            $ref: './Task/2',
            index: 'TSK-1243',
            title: "Interfejs zadania",
            summary: "Zadanie powinno wyglądać jak ładnie sformatowany dokument przy użyciu typografii. Tak jak właśnie wyświetlany rozdział. Zadanie powinno wyglądać jak ładnie sformatowany dokument przy użyciu typografii. Tak jak właśnie wyświetlany rozdział.",
            tags: '#urgent #server #cloud',
            Responsible:{
                $ref: './User/1077936130',
                Name: 'Alice'
            },
            DueDate: null,
            Phase: 1
        },

        {
            Id: 100,
            $ref: './Task/100',
            index: 'TSK-1243',
            title: "Interfejs zadania",
            tags: '#urgent #server #cloud',
            Responsible: null,
            DueDate:'2024-03-20T08:00Z',
            Phase: 1
        },



        {
            Id: 3,
            $ref: './Task/3',
            index: 'TSK-1243',
            title: "Interfejs zadania",
            summary: "Zadanie powinno wyglądać jak ładnie sformatowany dokument przy użyciu typografii. Tak jak właśnie wyświetlany rozdział.",
            tags: '#urgent #server #cloud',
            Responsible:{
                $ref: './User/1077936130',
                Name: 'Alice'
            },
            DueDate:'2024-03-20T08:00Z',
            Phase: 2
        },

        {
            Id: 4,
            $ref: './Task/4',
            index: 'TSK-1243',
            title: "Interfejs zadania",
            summary: "Zadanie powinno wyglądać jak ładnie sformatowany dokument przy użyciu typografii. Tak jak właśnie wyświetlany rozdział. Zadanie powinno wyglądać jak ładnie sformatowany dokument przy użyciu typografii. Tak jak właśnie wyświetlany rozdział.",
            tags: '#urgent #server #cloud',
            Responsible:{
                $ref: './User/1077936130',
                Name: 'Alice'
            },
            DueDate: null,
            Phase: 2
        },

        {
            Id: 5,
            $ref: './Task/5',
            index: 'TSK-1243',
            title: "Interfejs zadania",
            summary: "Zadanie powinno wyglądać jak ładnie sformatowany dokument przy użyciu typografii. Tak jak właśnie wyświetlany rozdział.",
            tags: '#urgent #server #cloud',
            Responsible: null,
            DueDate:'2024-03-20T08:00Z',
            Phase: 3
        },
        {
            Id: 6,
            $ref: './Task/6',
            index: 'TSK-1243',
            title: "Interfejs zadania",
            summary: "Zadanie powinno wyglądać jak ładnie sformatowany dokument przy użyciu typografii. Tak jak właśnie wyświetlany rozdział.",
            tags: '#urgent #server #cloud',
            Responsible: null,
            DueDate:'2024-03-20T08:00Z',
            Phase: 3
        },
        {
            Id: 7,
            $ref: './Task/7',
            index: 'TSK-1243',
            title: "Interfejs zadania",
            summary: "Zadanie powinno wyglądać jak ładnie sformatowany dokument przy użyciu typografii. Tak jak właśnie wyświetlany rozdział.",
            tags: '#urgent #server #cloud',
            Responsible: null,
            DueDate:'2024-03-20T08:00Z',
            Phase: 3
        },
        {
            Id: 8,
            $ref: './Task/8',
            index: 'TSK-1243',
            title: "Interfejs zadania",
            summary: "Zadanie powinno wyglądać jak ładnie sformatowany dokument przy użyciu typografii. Tak jak właśnie wyświetlany rozdział.",
            tags: '#urgent #server #cloud',
            Responsible: null,
            DueDate:'2024-03-20T08:00Z',
            Phase: 3
        },
    ]
}

/*if(task_id == 1077936130)
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
        */
       