// tslint:disable: no-unused-expression
import * as vscode from 'vscode';
import * as chai from 'chai';
import * as sinon from 'sinon';

import ChatClient from '../chat/ChatClient';
import { Themer } from '../commands/Themer';
import { Userstate } from 'tmi.js';
import { IChatMessage } from '../chat/IChatMessage';
import { API } from '../api/API';
import { IWhisperMessage } from '../chat/IWhisperMessage';

chai.should();

suite('Themer Tests', function () {
  let getConfigurationStub: sinon.SinonStub<any, vscode.WorkspaceConfiguration>;
  let fakeState: vscode.Memento;
  let fakeWorkspaceConfiguration: vscode.WorkspaceConfiguration;
  let fakeChatClient: ChatClient;
  let fakeThemer: Themer;
  const baseTheme: string = 'Visual Studio Dark';
  const testTheme: string = 'HotDogStand';
  const testBroadcastUser: string = 'theMichaelJolley';
  const broadcaster: Userstate = { 'username': testBroadcastUser.toLocaleLowerCase(), 'display-name': testBroadcastUser, 'badges': {'broadcaster': '1'}  };
  const moderator: Userstate = { 'username': 'parithon', 'display-name': 'parithon', 'badges': {'moderator': '1'}  };
  const user: Userstate = { 'username': 'surlydev', 'display-name': 'SurlyDev' };

  suiteSetup(function () {
    const fakeConfig: {
      [key: string]: any
    } = {
      'workbench.colorTheme': baseTheme
    };
    const stateValues: { [key: string]: any } = {
      'bannedUsers': [],
      'followerOnly': false,
      'subOnly': false
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
    fakeState.update('followerOnly', false);
    fakeState.update('subOnly', false);
    fakeWorkspaceConfiguration.update('workbench.colorTheme', baseTheme);
    fakeChatClient = new ChatClient(fakeState);
    fakeThemer = new Themer(fakeState);
    getConfigurationStub.resetHistory();
  });

  test(`Themer should return current theme (${baseTheme})`, function (done) {

    let sentMessage: string = '';
    const sendMessageStub = sinon.stub(fakeChatClient, 'sendMessage').callsFake((message: string) => {
      sentMessage = message;
    });
    fakeThemer.onSendMesssage(sendMessageStub);

    const message = 'current';
    const chatMessage: IChatMessage = { message, userState: user };

    fakeThemer.handleCommands(chatMessage)
      .then(() => {
        try {
          getConfigurationStub.calledOnce.should.be.true;
          sendMessageStub.calledOnce.should.be.true;
          sentMessage.should.equal(`The current theme is ${baseTheme}`);
          done();
        }
        catch (error) {
          done(error);
        }
      });
  });

  test('Themer should reset theme to original theme when requested', function (done) {

    fakeWorkspaceConfiguration.update('workbench.colorTheme', testTheme);

    const API_isTwitchUserFollowingStub = sinon.stub(API, 'isTwitchUserFollowing')
    .callsFake(async (twitchUserId: string | undefined) => {
      return true;
    });

    fakeThemer.resetTheme(broadcaster)
      .then(() => {
        try {
          fakeWorkspaceConfiguration.get<string>('workbench.colorTheme')!.should.equal(baseTheme);
          done();
        } catch (error) {
          done(error);
        }
      });
  });

  test(`Themer should change current theme to ${testTheme}`, function (done) {
    const chatMessage: IChatMessage = { message: testTheme, userState: user };

    fakeThemer.handleCommands(chatMessage)
      .then(() => {
        try {
          getConfigurationStub.calledOnce.should.be.true;
          fakeWorkspaceConfiguration.get<string>('workbench.colorTheme')!.should.equal(testTheme);
          done();
        }
        catch (error) {
          done(error);
        }
      });
  });

  test(`Themer should remove trailing comma and change current theme to ${testTheme}`, function (done) {
    console.log(fakeWorkspaceConfiguration.get<string>('workbench.colorTheme'));
    const chatMessage: IChatMessage = { message: `${testTheme},`, userState: user };

    fakeThemer.handleCommands(chatMessage)
      .then(() => {
        try {
          getConfigurationStub.calledOnce.should.be.true;
          fakeWorkspaceConfiguration.get<string>('workbench.colorTheme')!.should.equal(testTheme);
          done();
        }
        catch (error) {
          done(error);
        }
      });
  });

  test('Themer should return a comma seperated list of themes', function (done) {

    let recipient: string;
    let whisperedMessage: string;

    const whisperStub = sinon.stub(fakeChatClient, 'whisper').callsFake((whisperMessage: IWhisperMessage) => {
      recipient = whisperMessage.user;
      whisperedMessage = whisperMessage.message;
    });
    fakeThemer.onSendWhisper(whisperStub);

    const message = '';
    const chatMessage: IChatMessage = { message, userState: user };
    fakeThemer.handleCommands(chatMessage)
      .then(() => {
        try {
          whisperStub.calledOnce.should.be.true;
          recipient!.should.exist;
          recipient!.should.equal(user.username);
          whisperedMessage.should.exist;
          whisperedMessage.split(', ').length.should.be.greaterThan(0);
          done();
        }
        catch (error) {
          done(error);
        }
      });
  });

  test('Themer should ban a user', function(done) {
    const message = `ban ${user.username}`;
    const chatMessage: IChatMessage = { message, userState: moderator };

    fakeThemer.handleCommands(chatMessage)
      .then(() => {
        try {
          fakeState.get<any[]>('bannedUsers')!.should.not.be.empty;
          fakeState.get<any[]>('bannedUsers')!.should.contain(user.username);
          done();
        }
        catch (error) {
          done(error);
        }
      });
  });

  test('Themer should unban a user', function(done) {
    const message = `!ban ${user.username}`;
    const chatMessage: IChatMessage = { message, userState: moderator };

    fakeState.update('bannedUsers', [user.username]);
    fakeThemer = new Themer(fakeState);

    fakeThemer.handleCommands(chatMessage)
      .then(() => {
        try {
          fakeState.get<any[]>('bannedUsers')!.should.not.contain(user.username);
          done();
        }
        catch (error) {
          done(error);
        }
      });
  });

  test('Themer should not ban if user is not a moderator', function(done) {
    const message = `ban ${moderator.username}`;
    const chatMessage: IChatMessage = { message, userState: user };

    fakeThemer.handleCommands(chatMessage)
      .then(() => {
        try {
          fakeState.get<[]>('bannedUsers')!.should.be.empty;
          done();
        }
        catch (error) {
          done(error);
        }
      });
  });

  test('Themer should not unban if user is not a moderator', function(done) {
    const message = `!ban ${moderator.username}`;
    const chatMessage: IChatMessage = { message, userState: user };

    fakeState.update('bannedUsers', [moderator.username]);
    fakeThemer = new Themer(fakeState);

    fakeThemer.handleCommands(chatMessage)
      .then(() => {
        try {
          fakeState.get<string>('bannedUsers')!.should.not.be.empty;
          fakeState.get<string>('bannedUsers')!.should.contain(moderator.username);
          done();
        }
        catch (error) {
          done(error);
        }
      });
  });
});
