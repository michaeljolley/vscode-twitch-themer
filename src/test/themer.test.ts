// tslint:disable: no-unused-expression

import * as vscode from 'vscode';
import * as chai from 'chai';
import * as sinon from 'sinon';

import ChatClient from '../chat/ChatClient';
import { Themer } from '../commands/Themer';
import { Constants } from '../Constants';
import { Userstate } from 'tmi.js';

chai.should();

suite('Themer Tests', function () {
  let getConfigurationStub: sinon.SinonStub<any[], vscode.WorkspaceConfiguration>;
  let fakeState: vscode.Memento;
  let fakeWorkspaceConfiguration: vscode.WorkspaceConfiguration;
  let fakeChatClient: ChatClient;
  let fakeThemer: Themer;
  
  suiteSetup(function () {
    const fakeConfig: {
      [key: string]: any
    } = {
      'workbench.colorTheme': 'Visual Studio Dark'
    };
    const stateValues: { [key: string]: any } = {
      'bannedUsers': [],
      'followerOnly': false
    };
    fakeWorkspaceConfiguration = {
      get(section: string) {
        return fakeConfig[section];
      },
      has(section: string) {
        return Object.keys(fakeConfig).some(c => c === section);
      },
      inspect(section: string) {
        return undefined;
      },
      update(section: string, value: any, configurationTarget?: vscode.ConfigurationTarget | boolean) {
        fakeConfig[section] = value;
        return Promise.resolve();
      }
    };    
    fakeState = {
      get(key: string): any {
        return stateValues[key];
      },
      update(key: string, value: any) {
        stateValues[key] = value;
        return Promise.resolve();
      }
    };
    getConfigurationStub = sinon.stub(vscode.workspace, 'getConfiguration').returns(fakeWorkspaceConfiguration);
  });
  
  suiteTeardown(function () {
    getConfigurationStub.restore();
  });

  setup(function () {
    fakeState.update('bannedUsers', []);
    fakeState.update('followerOnly', true);
    fakeWorkspaceConfiguration.update('workbench.colorTheme', 'Visual Studio Dark');
    fakeChatClient = new ChatClient(fakeState);
    fakeThemer = new Themer(fakeChatClient, fakeState);
    getConfigurationStub.resetHistory();
  });
  
  test('Themer should return current theme (Visual Studio Dark)', function (done) {
    let sendMessage = '';

    const sendMessageStub = sinon.stub(fakeChatClient, 'sendMessage').callsFake((message: string) => {
      sendMessage = message;
    });

    fakeThemer.handleCommands({ "display-name": Constants.chatClientUserName }, '!theme', '')
      .then(() => {
        try {
          getConfigurationStub.calledOnce.should.be.true;
          sendMessageStub.calledOnce.should.be.true;
          sendMessage.should.equal(`The current theme is Visual Studio Dark`);
          done();
        }
        catch (error) {
          done(error);
        }
      });
  });

  test('Themer should reset theme to theme used when extension is activated', function (done) {
    const startupTheme = fakeWorkspaceConfiguration.get('workbench.colorTheme');

    fakeWorkspaceConfiguration.update('workbench.colorTheme', 'HotDog Stand');

    fakeThemer.resetTheme({badges: {broadcaster: "1"}})
      .then(() => {
        try {
          getConfigurationStub.calledOnce.should.be.true;
          fakeWorkspaceConfiguration.get('workbench.colorTheme')!.should.equal(startupTheme);
          done();
        } catch (error) {
          done(error);
        }
      });
  });

  test('Themer should change current theme to Default Dark+', function (done) {
    fakeThemer.handleCommands({ "display-name": Constants.chatClientUserName }, '!theme', 'Default Dark+')
      .then(() => {
        try {
          getConfigurationStub.calledOnce.should.be.true;
          fakeWorkspaceConfiguration.get('workbench.colorTheme')!.should.equal('Default Dark+');
          done();
        }
        catch (error) {
          done(error);
        }
      });
  });

  test('Themer should return a comma seperated list of themes', function (done) {
    let twitchUser: string | undefined;
    let sendMessage: string;

    const whisperStub = sinon.stub(fakeChatClient, 'whisper').callsFake((user: string | undefined, message: string) => {
      twitchUser = user;
      sendMessage = message;
    });

    fakeThemer.handleCommands({ "display-name": Constants.chatClientUserName }, '!theme', 'list')
      .then(() => {
        try {
          whisperStub.calledOnce.should.be.true;
          twitchUser!.should.exist;
          twitchUser!.should.equal(Constants.chatClientUserName);
          sendMessage.should.exist;
          sendMessage.split(', ').length.should.be.greaterThan(0);
          done();
        }
        catch (error) {
          done(error);
        }
      });
  });

  test('Themer should ban a user', function(done) {

    const bannedUser = 'hotdog';

    fakeThemer.handleCommands({ "display-name": Constants.chatClientUserName }, '!theme', `ban ${bannedUser}`)
      .then(() => {

        try {
          fakeState.get('bannedUsers')!.should.not.be.empty;
          fakeState.get('bannedUsers')!.should.contain(bannedUser);
          done();
        }
        catch (error) {
          done(error);
        }

      });

  });

  test('Themer should unban a user', function(done) {
    const bannedUser = 'hotdog';

    fakeState.update('bannedUsers', [bannedUser]);
    fakeThemer = new Themer(fakeChatClient, fakeState);

    fakeThemer.handleCommands({ "display-name": Constants.chatClientUserName }, '!theme', `unban ${bannedUser}`)
      .then(() => {

        try {
          fakeState.get('bannedUsers')!.should.not.contain(bannedUser);
          done();
        }
        catch (error) {
          done(error);
        }

      });

  });

  test('Themer should not ban if user is not the logged in user', function(done) {
    const bannedUser = 'hotdog';
    const twitchUser = { "display-name": 'goofey' };

    fakeThemer.handleCommands(twitchUser, '!theme', `ban ${bannedUser}`)
      .then(() => {

        try {
          fakeState.get('bannedUsers')!.should.be.empty;
          done();
        }
        catch (error) {
          done(error);
        }
      });
  });

  test('Themer should not unban if user is not the logged in user', function(done) {
    const bannedUser = 'hotdog';
    const twitchUser: Userstate = { 'display-name': 'goofey' };

    fakeState.update('bannedUsers', [bannedUser]);

    fakeThemer.handleCommands(twitchUser, '!theme', `unban ${bannedUser}`)
      .then(() => {

        try{
          fakeState.get('bannedUsers')!.should.not.be.empty;
          fakeState.get('bannedUsers')!.should.contain(bannedUser);
          done();
        }
        catch (error) {
          done(error);
        }
      });
  });

  test('Themer should go to follower only mode if user is the logged in user', function(done) {
    const twitchUser = { "display-name": Constants.chatClientUserName };
    fakeState.update('followerOnly', false);

    fakeThemer.handleCommands(twitchUser, '!theme', `follower`)
      .then(() => {
        try {
          fakeState.get('followerOnly')!.should.be.true;
          done();
        }
        catch (error) {
          done(error);
        }
      });
  });

  test('Themer should not go to follower only mode if user is not the logged in user', function(done) {
    const twitchUser = { "display-name": 'goofey' };
    fakeState.update('followerOnly', false);

    fakeThemer.handleCommands(twitchUser, '!theme', `follower`)
      .then(() => {
        try {
          fakeState.get('followerOnly')!.should.be.false;
          done();
        }
        catch (error) {
          done(error);
        }
      });
  });
  
  test('Themer should leave follower only mode if user is the logged in user', function(done) {
    const twitchUser = { "display-name": Constants.chatClientUserName };
    fakeState.update('followerOnly', true);

    fakeThemer.handleCommands(twitchUser, '!theme', `!follower`)
      .then(() => {
        try {
          fakeState.get('followerOnly')!.should.be.false;
          done();
        }
        catch (error) {
          done(error);
        }
      });
  });

  test('Themer should not leave follower only mode if user is not the logged in user', function(done) {
    const twitchUser = { "display-name": 'goofey' };
    fakeState.update('followerOnly', true);

    fakeThemer.handleCommands(twitchUser, '!theme', `!follower`)
      .then(() => {
        try {
          fakeState.get('followerOnly')!.should.be.true;
          done();
        }
        catch (error) {
          done(error);
        }
      });
  });
});