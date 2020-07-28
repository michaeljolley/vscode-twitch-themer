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
import { AccessState } from '../Enum';
import { Logger } from '../Logger';

chai.should();

suite('Themer Tests', function() {
  let getConfigurationStub: sinon.SinonStub<
    [(string | undefined)?, (vscode.Uri | null | undefined)?],
    vscode.WorkspaceConfiguration
  >;
  let isTwitchUserFollowingStub: sinon.SinonStub<
    [(string | undefined), Logger],
    Promise<boolean>
  >;
  let fakeLogger: Logger;
  let fakeState: vscode.Memento;
  let fakeWorkspaceConfiguration: vscode.WorkspaceConfiguration;
  let fakeChatClient: ChatClient;
  let fakeThemer: Themer;
  let isTwitchUserFollowingReturn : boolean = false;
  const baseTheme: string = 'Visual Studio Light';
  const testTheme: string = 'Visual Studio Dark';
  const badTheme: string = 'HotDog Stand';
  const testBroadcastUser: string = 'theMichaelJolley';
  const broadcaster: Userstate = {
    username: testBroadcastUser.toLocaleLowerCase(),
    'display-name': testBroadcastUser,
    badges: { broadcaster: '1' }
  };
  const moderator: Userstate = {
    username: 'parithon',
    'display-name': 'parithon',
    badges: { moderator: '1' }
  };
  const subscriber: Userstate = {
    username: 'spellbee2',
    'display-name': 'spellbee2',
    subscriber: true
  };
  const user: Userstate = {
    username: 'surlydev',
    'display-name': 'SurlyDev'
  };

  suiteSetup(function() {
    const fakeConfig: {
      [key: string]: any;
    } = {
      'workbench.colorTheme': baseTheme
    };
    const stateValues: { [key: string]: any } = {
      bannedUsers: [],
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
      update(
        section: string,
        value: any,
        configurationTarget?: vscode.ConfigurationTarget | boolean
      ) {
        fakeConfig[section] = value;
        return Promise.resolve();
      }
    };
    fakeLogger = new Logger();
    fakeState = {
      get(key: string): any {
        return stateValues[key];
      },
      update(key: string, value: any) {
        stateValues[key] = value;
        return Promise.resolve();
      }
    };
    getConfigurationStub = sinon
      .stub(vscode.workspace, 'getConfiguration')
      .returns(fakeWorkspaceConfiguration);
    isTwitchUserFollowingStub = sinon
      .stub(API, 'isTwitchUserFollowing')
      .callsFake(async (twitchUserId: string | undefined) => {
        return isTwitchUserFollowingReturn;
      });
  });

  suiteTeardown(function() {
    getConfigurationStub.restore();
    isTwitchUserFollowingStub.restore();
  });

  setup(function() {
    fakeState.update('bannedUsers', []);
    fakeWorkspaceConfiguration.update('workbench.colorTheme', baseTheme);
    fakeChatClient = new ChatClient(fakeState, fakeLogger);
    fakeThemer = new Themer(fakeState, fakeLogger);
    fakeThemer.handleAccessStateChanged(AccessState.Viewers);
    getConfigurationStub.resetHistory();
    isTwitchUserFollowingStub.resetHistory();
    isTwitchUserFollowingReturn = false;
  });

  test(`Themer should explain how to use extension to chat`, function(done) {
    let sentMessage: string = '';
    const sendMessageStub = sinon
      .stub(fakeChatClient, 'sendMessage')
      .callsFake((message: string) => {
        sentMessage = message;
      });
    fakeThemer.onSendMesssage(sendMessageStub);

    const message = 'help';
    const chatMessage: IChatMessage = { message, userState: user };

    const helpMessage: string = `You can change the theme of the stream's VS\
              Code by sending '!theme random'. You can also choose a theme\
              specifically. Send '!theme' to be whispered a list of available\
              themes.`;

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        sendMessageStub.calledOnce.should.be.true;
        sentMessage.should.equal(helpMessage);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test(`Themer should return current theme (${baseTheme})`, function(done) {
    let sentMessage: string = '';
    const sendMessageStub = sinon
      .stub(fakeChatClient, 'sendMessage')
      .callsFake((message: string) => {
        sentMessage = message;
      });
    fakeThemer.onSendMesssage(sendMessageStub);

    const message = 'current';
    const chatMessage: IChatMessage = { message, userState: user };

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        getConfigurationStub.calledOnce.should.be.true;
        sendMessageStub.calledOnce.should.be.true;
        sentMessage.should.equal(`The current theme is ${baseTheme}`);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test(`Themer should return info about the GitHub repo`, function(done) {
    let sentMessage: string = '';
    const sendMessageStub = sinon
      .stub(fakeChatClient, 'sendMessage')
      .callsFake((message: string) => {
        sentMessage = message;
      });
    fakeThemer.onSendMesssage(sendMessageStub);

    const message = 'repo';
    const chatMessage: IChatMessage = { message, userState: user };

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        sendMessageStub.calledOnce.should.be.true;
        sentMessage.should.equal('You can find the source code for this VS \
        Code extension at https://github.com/MichaelJolley/vscode-twitch-themer. \
        Feel free to fork & contribute.');
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test('Themer should reset theme to original theme when requested', function(done) {
    fakeWorkspaceConfiguration.update('workbench.colorTheme', testTheme);

    fakeThemer.resetTheme(broadcaster).then(() => {
      try {
        fakeWorkspaceConfiguration
          .get<string>('workbench.colorTheme')!
          .should.equal(baseTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test(`Themer should change current theme to ${testTheme}`, function(done) {
    const chatMessage: IChatMessage = { message: testTheme, userState: user };

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        getConfigurationStub.calledOnce.should.be.true;
        fakeWorkspaceConfiguration
          .get<string>('workbench.colorTheme')!
          .should.equal(testTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test(`Themer should remove trailing comma and change current theme to ${testTheme}`, function (done) {
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

  test('Themer should return a comma seperated list of themes', function(done) {
    let recipient: string;
    let whisperedMessage: string;

    const whisperStub = sinon
      .stub(fakeChatClient, 'whisper')
      .callsFake((whisperMessage: IWhisperMessage) => {
        recipient = whisperMessage.user;
        whisperedMessage = whisperMessage.message;
      });
    fakeThemer.onSendWhisper(whisperStub);

    const message = '';
    const chatMessage: IChatMessage = { message, userState: user };
    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        whisperStub.calledOnce.should.be.true;
        recipient!.should.exist;
        recipient!.should.equal(user.username);
        whisperedMessage.should.exist;
        whisperedMessage.split(', ').length.should.be.greaterThan(0);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test(`Themer should change the theme to a random theme when using !theme random`, function(done) {
    const chatMessage: IChatMessage = { message: 'random', userState: user };

    fakeWorkspaceConfiguration.update('workbench.colorTheme', baseTheme);

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeWorkspaceConfiguration
          .get<string>('workbench.colorTheme')!
          .should.not.equal(baseTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test(`Themer should change the theme to a random dark theme when using !theme random dark`, function(done) {
    const chatMessage: IChatMessage = { message: 'random dark', userState: user };

    /* baseTheme is light.  Set now so we can be sure we get a dark theme after running the command */
    fakeWorkspaceConfiguration.update('workbench.colorTheme', baseTheme);

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeWorkspaceConfiguration
          .get<string>('workbench.colorTheme')!
          .should.not.equal(baseTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test(`Themer should change the theme to a random light theme when using !theme random light`, function(done) {
    const chatMessage: IChatMessage = { message: 'random light', userState: user };

    /* testTheme is dark.  Set now so we can be sure we get a light theme after running the command */
    fakeWorkspaceConfiguration.update('workbench.colorTheme', testTheme);

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeWorkspaceConfiguration
          .get<string>('workbench.colorTheme')!
          .should.not.equal(testTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test('Themer should ban a user', function(done) {
    const message = `ban ${user.username}`;
    const chatMessage: IChatMessage = { message, userState: moderator };

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeState.get<any[]>('bannedUsers')!.should.not.be.empty;
        fakeState.get<any[]>('bannedUsers')!.should.contain(user.username);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test('Themer should unban a user', function(done) {
    const message = `!ban ${user.username}`;
    const chatMessage: IChatMessage = { message, userState: moderator };

    fakeState.update('bannedUsers', [user.username]);
    fakeThemer = new Themer(fakeState, fakeLogger);

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeState.get<any[]>('bannedUsers')!.should.not.contain(user.username);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test('Themer should not ban if user is not a moderator', function(done) {
    const message = `ban ${moderator.username}`;
    const chatMessage: IChatMessage = { message, userState: user };

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeState.get<[]>('bannedUsers')!.should.be.empty;
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test('Themer should not unban if user is not a moderator', function(done) {
    const message = `!ban ${moderator.username}`;
    const chatMessage: IChatMessage = { message, userState: user };

    fakeState.update('bannedUsers', [moderator.username]);
    fakeThemer = new Themer(fakeState, fakeLogger);

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeState.get<string>('bannedUsers')!.should.not.be.empty;
        fakeState
          .get<string>('bannedUsers')!
          .should.contain(moderator.username);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test('Themer should prevent theme changes by viewers if the AccessState is set to Followers', function(done) {
    const chatMessage: IChatMessage = { message: testTheme, userState: user };
    isTwitchUserFollowingReturn = false;

    fakeThemer.handleAccessStateChanged(AccessState.Followers);
    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeWorkspaceConfiguration
          .get<string>('workbench.colorTheme')!
          .should.equal(baseTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test('Themer should allow theme changes by followers if the AccessState is set to Followers', function(done) {
    const chatMessage: IChatMessage = { message: testTheme, userState: user };
    isTwitchUserFollowingReturn = true;

    fakeThemer.handleAccessStateChanged(AccessState.Followers);
    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeWorkspaceConfiguration
          .get<string>('workbench.colorTheme')!
          .should.equal(testTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test('Themer should prevent theme changes by viewers if the AccessState is set to Subscribers', function(done) {
    const chatMessage: IChatMessage = { message: testTheme, userState: user };
    isTwitchUserFollowingReturn = false;

    fakeThemer.handleAccessStateChanged(AccessState.Subscribers);
    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeWorkspaceConfiguration
          .get<string>('workbench.colorTheme')!
          .should.equal(baseTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test('Themer should prevent theme changes by followers if the AccessState is set to Subscribers', function(done) {
    const chatMessage: IChatMessage = { message: testTheme, userState: user };
    isTwitchUserFollowingReturn = true;
    fakeThemer.handleAccessStateChanged(AccessState.Subscribers);

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeWorkspaceConfiguration
          .get<string>('workbench.colorTheme')!
          .should.equal(baseTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test('Themer should allow theme changes by subscribers if the AccessState is set to Subscribers', function(done) {
    const chatMessage: IChatMessage = { message: testTheme, userState: subscriber };

    fakeThemer.handleAccessStateChanged(AccessState.Subscribers);
    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeWorkspaceConfiguration
          .get<string>('workbench.colorTheme')!
          .should.equal(testTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});
