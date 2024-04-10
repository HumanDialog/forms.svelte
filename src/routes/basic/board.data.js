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