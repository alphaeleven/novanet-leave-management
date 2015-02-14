Leave Management Application
===

This is a leave management application, which allows the employees of an organization to apply for leaves, managers can view the leave requests and can approve or reject the leave request.

The maximum duration for a leave can be of 15 days and it excludes weekends and national holidays. This value is configurable.


## How to setup?

To setup the application clone this repository, install node dependencies and you should be ready to run the application.
NOTE: This guide assumes that you are familior with git tool.

```
git clone https://github.com/riteshsangwan/novanet-leave-management.git
cd novanet-leave-management
npm install
```

The application uses bower for client dependencies. ```npm install``` command should run ```bower install``` in postinstall script which will install bower dependencies.

The application uses grunt as javascript task runner.

## Configuration?

The application uses [node-config](https://github.com/lorenwest/node-config) for application configuration.

The application uses mysql db as the data storage solution.

The application uses [novanet-datasource](https://github.com/riteshsangwan/novanet-datasource) npm module which is specifically designed for this application.

The datasource module has following two mandatory configurations

```
  "datasource": {
    "dbUrl": "mysql://root:password@localhost:3306/novanet",
    "modelsDirectory": "./models"
  }
```

Make sure that the mysql connection string is correct.
Read more about the datasource module on the github readme page of module.

Almost all the configurations are self explanatory.

## Database migrations?

Application uses db-migrate to manage database migration.
Run ```grunt dbmigrate``` task and it will setup database for you in a single command.
It will create necessary tables in mysql and populate the initial data.

## Run application?

To run the application, run following command in application root directory

```node app.js```

This should start the application server on port ```4040``` as per the default configuration. Navigate to http://localhost:4040 to see application in action.