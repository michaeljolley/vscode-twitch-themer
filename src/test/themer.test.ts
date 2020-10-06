// tslint:disable: no-unused-expression
import * as vscode from 'vscode';
import * as chai from 'chai';
import * as sinon from 'sinon';

import ChatClient from '../chat/ChatClient';
import { Themer } from '../commands/Themer';
import { IChatMessage } from '../chat/IChatMessage';
import { API } from '../api/API';
import { IWhisperMessage } from '../chat/IWhisperMessage';
import { AccessState } from '../Enum';
import { Logger } from '../Logger';
import { OnCommandExtra, OnMessageFlags } from 'comfy.js';

chai.should();

suite('Themer Tests', function () {
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
  let isTwitchUserFollowingReturn: boolean = false;
  const baseTheme: string = 'Visual Studio Light';
  const testTheme: string = 'Visual Studio Dark';
  const badTheme: string = 'HotDog Stand';
  const testBroadcastUser: string = 'BaldBeardedBuilder';
  const broadcaster: OnMessageFlags = {
    broadcaster: true,
    mod: false,
    subscriber: false,
    vip: false,
    founder: false,
    highlighted: false,
    customReward: false
  };
  const moderator: OnMessageFlags = {
    broadcaster: false,
    mod: true,
    subscriber: false,
    vip: false,
    founder: false,
    highlighted: false,
    customReward: false
  };
  const subscriber: OnMessageFlags = {
    broadcaster: false,
    mod: false,
    subscriber: true,
    vip: false,
    founder: false,
    highlighted: false,
    customReward: false
  };
  const user: OnMessageFlags = {
    broadcaster: false,
    mod: false,
    subscriber: false,
    vip: false,
    founder: false,
    highlighted: false,
    customReward: false
  };
  const rewardFlags: OnMessageFlags = {
    broadcaster: false,
    mod: false,
    subscriber: false,
    vip: false,
    founder: false,
    highlighted: false,
    customReward: true
  };

  const standardExtra: OnCommandExtra = {
    id: 'string',
    channel: 'string',
    roomId: 'string',
    messageType: 'chat',
    messageEmotes: {},
    isEmoteOnly: false,
    userId: 'string',
    username: 'roberttables',
    displayName: 'roberttables',
    userColor: 'string',
    userBadges: {},
    customRewardId: '',
    flags: {},
    timestamp: 'string',
    sinceLastCommand: {
      any: 0,
      user: 0
    }
  };

  const rewardExtra: OnCommandExtra = {
    id: 'string',
    channel: 'string',
    roomId: 'string',
    messageType: 'chat',
    messageEmotes: {},
    isEmoteOnly: false,
    userId: 'string',
    username: 'roberttables',
    displayName: 'roberttables',
    userColor: 'string',
    userBadges: {},
    customRewardId: 'blahblahblah',
    flags: {},
    timestamp: 'string',
    sinceLastCommand: {
      any: 0,
      user: 0
    }
  };

  suiteSetup(function () {
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

  suiteTeardown(function () {
    getConfigurationStub.restore();
    isTwitchUserFollowingStub.restore();
  });

  setup(function () {
    fakeState.update('bannedUsers', []);
    fakeWorkspaceConfiguration.update('workbench.colorTheme', baseTheme);
    fakeChatClient = new ChatClient(fakeState, fakeLogger);
    fakeThemer = new Themer(fakeState, fakeLogger);
    fakeThemer.handleAccessStateChanged(AccessState.Viewers);
    getConfigurationStub.resetHistory();
    isTwitchUserFollowingStub.resetHistory();
    isTwitchUserFollowingReturn = false;
  });

  test(`Themer should explain how to use extension to chat`, function (done) {
    let sentMessage: string = '';
    const sendMessageStub = sinon
      .stub(fakeChatClient, 'sendMessage')
      .callsFake(async (message: string) => {
        sentMessage = message;
      });
    fakeThemer.onSendMessage(sendMessageStub);

    const message = 'help';
    const chatMessage: IChatMessage = { message, flags: user, user: 'test', extra: standardExtra };

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

  test(`Themer should return current theme (${baseTheme})`, function (done) {
    let sentMessage: string = '';
    const sendMessageStub = sinon
      .stub(fakeChatClient, 'sendMessage')
      .callsFake(async (message: string) => {
        sentMessage = message;
      });
    fakeThemer.onSendMessage(sendMessageStub);

    const message = 'current';
    const chatMessage: IChatMessage = { message, flags: user, user: 'test', extra: standardExtra };

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

  test(`Themer should return info about the GitHub repo`, function (done) {
    let sentMessage: string = '';
    const sendMessageStub = sinon
      .stub(fakeChatClient, 'sendMessage')
      .callsFake(async (message: string) => {
        sentMessage = message;
      });
    fakeThemer.onSendMessage(sendMessageStub);

    const message = 'repo';
    const chatMessage: IChatMessage = { message, flags: user, user: 'test', extra: standardExtra };

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

  test('Themer should reset theme to original theme when requested', function (done) {
    fakeWorkspaceConfiguration.update('workbench.colorTheme', testTheme);

    fakeThemer.resetTheme('roberttables', user).then(() => {
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

  test(`Themer should change current theme to ${testTheme}`, function (done) {
    const chatMessage: IChatMessage = { message: testTheme, flags: user, user: 'test', extra: standardExtra };

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
    const chatMessage: IChatMessage = { message: `${testTheme},`, flags: user, user: 'test', extra: standardExtra };

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

  test('Themer should return a comma separated list of themes', function (done) {
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
    const chatMessage: IChatMessage = { message, flags: user, user: 'test', extra: standardExtra };
    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        whisperStub.calledOnce.should.be.true;
        recipient!.should.exist;
        recipient!.should.equal('test');
        whisperedMessage.should.exist;
        whisperedMessage.split(', ').length.should.be.greaterThan(0);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test(`Themer should change the theme to a random theme when using !theme random`, function (done) {
    const chatMessage: IChatMessage = { message: 'random', flags: user, user: 'test', extra: standardExtra };

    const currentTheme = fakeWorkspaceConfiguration.get('workbench.colorTheme') || baseTheme;
    // fakeWorkspaceConfiguration.update('workbench.colorTheme', baseTheme);

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeWorkspaceConfiguration
          .get<string>('workbench.colorTheme')!
          .should.not.equal(currentTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test(`Themer should change the theme to a random dark theme when using !theme random dark`, function (done) {
    const chatMessage: IChatMessage = { message: 'random dark', flags: user, user: 'test', extra: standardExtra };

    /* baseTheme is light.  Set now so we can be sure we get a dark theme after running the command */
    const currentTheme = fakeWorkspaceConfiguration.get('workbench.colorTheme') || baseTheme;
    // fakeWorkspaceConfiguration.update('workbench.colorTheme', baseTheme);

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeWorkspaceConfiguration
          .get<string>('workbench.colorTheme')!
          .should.not.equal(currentTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test(`Themer should change the theme to a random light theme when using !theme random light`, function (done) {
    const chatMessage: IChatMessage = { message: 'random light', flags: user, user: 'test', extra: standardExtra };

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

  test('Themer should ban a user', function (done) {
    const message = `ban mantas159159`;
    const chatMessage: IChatMessage = { message, flags: moderator, user: 'test', extra: standardExtra };

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeState.get<any[]>('bannedUsers')!.should.not.be.empty;
        fakeState.get<any[]>('bannedUsers')!.should.contain('mantas159159');
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test('Themer should unban a user', function (done) {
    const message = `!ban mantas159159`;
    const chatMessage: IChatMessage = { message, flags: moderator, user: 'test', extra: standardExtra };

    fakeState.update('bannedUsers', ['test']);
    fakeThemer = new Themer(fakeState, fakeLogger);

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeState.get<any[]>('bannedUsers')!.should.not.contain('mantas159159');
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test('Themer should not ban if user is not a moderator', function (done) {
    const message = `ban exegete46`;
    const chatMessage: IChatMessage = { message, flags: user, user: 'test', extra: standardExtra };

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeState.get<[]>('bannedUsers')!.should.be.empty;
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test('Themer should not unban if user is not a moderator', function (done) {
    const message = `!ban exegete46`;
    const chatMessage: IChatMessage = { message, flags: user, user: 'test', extra: standardExtra };

    fakeState.update('bannedUsers', ['exegete46']);
    fakeThemer = new Themer(fakeState, fakeLogger);

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeState.get<string>('bannedUsers')!.should.not.be.empty;
        fakeState
          .get<string>('bannedUsers')!
          .should.contain('exegete46');
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test('Themer should prevent theme changes by viewers if the AccessState is set to Followers', function (done) {
    const chatMessage: IChatMessage = { message: testTheme, flags: user, user: 'test', extra: standardExtra };
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

  test('Themer should allow theme changes by followers if the AccessState is set to Followers', function (done) {
    const chatMessage: IChatMessage = { message: testTheme, flags: user, user: 'test', extra: standardExtra };
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

  test('Themer should prevent theme changes by viewers if the AccessState is set to Subscribers', function (done) {
    const chatMessage: IChatMessage = { message: testTheme, flags: user, user: 'test', extra: standardExtra };
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

  test('Themer should prevent theme changes by followers if the AccessState is set to Subscribers', function (done) {
    const chatMessage: IChatMessage = { message: testTheme, flags: user, user: 'test', extra: standardExtra };
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

  test('Themer should allow theme changes by subscribers if the AccessState is set to Subscribers', function (done) {
    const chatMessage: IChatMessage = { message: testTheme, flags: subscriber, user: 'test', extra: standardExtra };

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
