
const octopusTestUsers = [
    {
        username: "alice@example.com",
        role: 'GroupOwner',
        groupId: 15
    },
    {
        username: "bob@example.com",
        role: 'GroupMember',
        groupId: 15
    }
]

const hdTestUsers = [
    {
        username: "aga@humandialog.com.pl",
        role: 'GroupOwner',
        groupId: 1
    },
    {
        username: "akr@humandialog.com.pl",
        role: 'GroupMember',
        groupId: 1
    }
]

const tilosTestUsers = [
    { username: "emma@example.com",       role: "TUHCustomer", groupId: 15   },
    { username: "jack@example.com",       role: "TUHCustomer", groupId: 15   },
    { username: "olivia@example.com",     role: "TUHCustomer", groupId: 15   },

    { username: "admin@example.com",     role: "TUHServiceman", groupId: 15   },
    
]

function getAppUsers(setName)
{
    switch(setName)
    {
    case 'octopus':
        return octopusTestUsers;

    case 'hd':
        return hdTestUsers;

    case 'tilos':
        return tilosTestUsers;
    }
}

export const appUsers = getAppUsers(__USERS_SET__)
