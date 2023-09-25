// tslint:disable: no-unused-expression
import * as vscode from "vscode";
import * as chai from "chai";
import * as sinon from "sinon";

import API from "../../api";
import ChatClient from "../../chatClient";
import Themer from "../../themer";
import { ChatMessage } from "../../types/chatMessage";
import {
  AccessState,
  messageCurrent,
  messageHelp,
  messagePaused,
  messageRepo,
} from "../../constants";
import { OnCommandExtra, OnMessageFlags } from "comfy.js";

chai.should();

suite("Themer Tests", function () {
  let getConfigurationStub: sinon.SinonStub<
    [
      section?: string | undefined,
      scope?: vscode.ConfigurationScope | null | undefined,
    ],
    vscode.WorkspaceConfiguration
  >;
  let isTwitchUserFollowingStub: sinon.SinonStub<
    [string | undefined],
    Promise<boolean>
  >;
  let fakeState: vscode.Memento;
  let fakeWorkspaceConfiguration: vscode.WorkspaceConfiguration;
  let fakeChatClient: ChatClient;
  let fakeThemer: Themer;
  let isTwitchUserFollowingReturn: boolean = false;
  const baseTheme: string = "Visual Studio Light";
  const testTheme: string = "Visual Studio Dark";
  const baseThemeId: string = "vscode.theme-defaults";
  const installedTheme: string = "C/C++ Themes";
  const installedThemeId: string = "ms-vscode.cpptools-themes";
  const broadcaster: OnMessageFlags = {
    broadcaster: true,
    mod: false,
    subscriber: false,
    vip: false,
    founder: false,
    highlighted: false,
    customReward: false,
  };
  const moderator: OnMessageFlags = {
    broadcaster: false,
    mod: true,
    subscriber: false,
    vip: false,
    founder: false,
    highlighted: false,
    customReward: false,
  };
  const vip: OnMessageFlags = {
    broadcaster: false,
    mod: false,
    subscriber: false,
    vip: true,
    founder: false,
    highlighted: false,
    customReward: false,
  };
  const subscriber: OnMessageFlags = {
    broadcaster: false,
    mod: false,
    subscriber: true,
    vip: false,
    founder: false,
    highlighted: false,
    customReward: false,
  };
  const user: OnMessageFlags = {
    broadcaster: false,
    mod: false,
    subscriber: false,
    vip: false,
    founder: false,
    highlighted: false,
    customReward: false,
  };
  const rewardFlags: OnMessageFlags = {
    broadcaster: false,
    mod: false,
    subscriber: false,
    vip: false,
    founder: false,
    highlighted: false,
    customReward: true,
  };

  const standardExtra: OnCommandExtra = {
    id: "string",
    channel: "string",
    roomId: "string",
    messageType: "chat",
    messageEmotes: {},
    isEmoteOnly: false,
    userId: "string",
    username: "roberttables",
    displayName: "roberttables",
    userColor: "string",
    userBadges: {},
    customRewardId: "",
    flags: {},
    timestamp: "string",
    sinceLastCommand: {
      any: 0,
      user: 0,
    },
  };

  suiteSetup(function () {
    const fakeConfig: {
      [key: string]: any;
    } = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "workbench.colorTheme": baseTheme,
    };
    const stateValues: { [key: string]: any } = {
      bannedUsers: [],
    };
    fakeWorkspaceConfiguration = {
      get(section: string) {
        return fakeConfig[section];
      },
      has(section: string) {
        return Object.keys(fakeConfig).some((c) => c === section);
      },
      inspect(section: string) {
        return undefined;
      },
      update(
        section: string,
        value: any,
        configurationTarget?: vscode.ConfigurationTarget | boolean,
      ) {
        fakeConfig[section] = value;
        return Promise.resolve();
      },
    };
    fakeState = {
      keys() {
        return Object.keys(stateValues);
      },
      get(key: string): any {
        return stateValues[key];
      },
      update(key: string, value: any) {
        stateValues[key] = value;
        return Promise.resolve();
      },
    };
    getConfigurationStub = sinon
      .stub(vscode.workspace, "getConfiguration")
      .returns(fakeWorkspaceConfiguration);
    isTwitchUserFollowingStub = sinon
      .stub(API, "isTwitchUserFollowing")
      .callsFake(
        async (
          twitchUserId: string | undefined,
        ): Promise<boolean> => {
          return isTwitchUserFollowingReturn;
        },
      );
  });

  suiteTeardown(function () {
    getConfigurationStub.restore();
    isTwitchUserFollowingStub.restore();
  });

  setup(function () {
    fakeState.update("bannedUsers", []);
    fakeWorkspaceConfiguration.update("workbench.colorTheme", baseTheme);
    fakeChatClient = new ChatClient();
    fakeThemer = new Themer(fakeState);
    fakeThemer.initializeConfiguration();
    getConfigurationStub.resetHistory();
    isTwitchUserFollowingStub.resetHistory();
    isTwitchUserFollowingReturn = false;
  });

  test(`Themer should explain how to use extension to chat`, function (done) {
    let sentMessage: string = "";
    const sendMessageStub = sinon
      .stub(fakeChatClient, "sendMessage")
      .callsFake(async (message: string) => {
        sentMessage = message;
      });
    fakeThemer.onSendMessage(sendMessageStub);

    const message = "help";
    const chatMessage: ChatMessage = {
      message,
      flags: user,
      user: "test",
      extra: standardExtra,
    };

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        sendMessageStub.calledOnce.should.be.true;
        sentMessage.should.equal(messageHelp);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test(`Themer should return current theme (${baseTheme})`, function (done) {
    let sentMessage: string = "";
    const sendMessageStub = sinon
      .stub(fakeChatClient, "sendMessage")
      .callsFake(async (message: string) => {
        sentMessage = message;
      });
    fakeThemer.onSendMessage(sendMessageStub);

    const message = "current";
    const chatMessage: ChatMessage = {
      message,
      flags: user,
      user: "test",
      extra: standardExtra,
    };

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        getConfigurationStub.calledOnce.should.be.true;
        sendMessageStub.calledOnce.should.be.true;
        sentMessage.should.equal(messageCurrent(baseTheme, baseThemeId));
        done();
      } catch (error) {
        done(error);
      }
    });
  });


  test(`Themer should return info about the built in theme`, function (done) {
    let sentMessage: string = "";

    fakeState.update("workBen")

    const sendMessageStub = sinon
      .stub(fakeChatClient, "sendMessage")
      .callsFake(async (message: string) => {
        sentMessage = message;
      });
    fakeTherm.onSendMessage(sendMessageStub);

    fakeWorkspaceConfiguration.update("workbench.colorTheme", installedTheme);

    const message = "current";
    const chatMessage: ChatMessage = {
      message,
      flags: user,
      user: "test",
      extra: standardExtra
    };

    fakeThemer.handleCommands(chatMessage).then(() => {
      getConfigurationStub.calledOnce.should.be.true;
      sendMessageStub.calledOnce.should.be.true;
      sentMessage.should.equal(messageCurrent(installedTheme, installedThemeId));
    })
  })

  test(`Themer should return info about the GitHub repo`, function (done) {
    let sentMessage: string = "";
    const sendMessageStub = sinon
      .stub(fakeChatClient, "sendMessage")
      .callsFake(async (message: string) => {
        sentMessage = message;
      });
    fakeThemer.onSendMessage(sendMessageStub);

    const message = "repo";
    const chatMessage: ChatMessage = {
      message,
      flags: user,
      user: "test",
      extra: standardExtra,
    };

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        sendMessageStub.calledOnce.should.be.true;
        sentMessage.should.equal(messageRepo);
        done();
      } catch (error) {
        done(error);
      }
    });
  });


  test("Themer should reset theme to original theme when requested", function (done) {
    fakeWorkspaceConfiguration.update("workbench.colorTheme", testTheme);

    fakeThemer.resetTheme("roberttables", "123", user).then(() => {
      try {
        fakeWorkspaceConfiguration
          .get<string>("workbench.colorTheme")!
          .should.equal(baseTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test("Themer should respond with a paused message if paused", function (done) {
    let sentMessage: string = "";
    const sendMessageStub = sinon
      .stub(fakeChatClient, "sendMessage")
      .callsFake(async (message: string) => {
        sentMessage = message;
      });
    fakeThemer.onSendMessage(sendMessageStub);

    const chatMessage: ChatMessage = {
      message: testTheme,
      flags: user,
      user: "test",
      extra: standardExtra,
    };

    fakeThemer.setPauseStatus(true);
    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        sendMessageStub.calledOnce.should.be.true;
        sentMessage.should.equal(messagePaused(chatMessage.user));
        fakeWorkspaceConfiguration
          .get<string>("workbench.colorTheme")!
          .should.equal(baseTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test(`Themer should change current theme to ${testTheme}`, function (done) {
    const chatMessage: ChatMessage = {
      message: testTheme,
      flags: user,
      user: "test",
      extra: standardExtra,
    };

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        getConfigurationStub.calledOnce.should.be.true;
        fakeWorkspaceConfiguration
          .get<string>("workbench.colorTheme")!
          .should.equal(testTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test(`Themer should remove trailing comma and change current theme to ${testTheme}`, function (done) {
    const chatMessage: ChatMessage = {
      message: `${testTheme},`,
      flags: user,
      user: "test",
      extra: standardExtra,
    };

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        getConfigurationStub.calledOnce.should.be.true;
        fakeWorkspaceConfiguration
          .get<string>("workbench.colorTheme")!
          .should.equal(testTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test(`Themer should change the theme to a random theme when using !theme random`, function (done) {
    const chatMessage: ChatMessage = {
      message: "random",
      flags: user,
      user: "test",
      extra: standardExtra,
    };

    const currentTheme =
      fakeWorkspaceConfiguration.get("workbench.colorTheme") || baseTheme;
    // fakeWorkspaceConfiguration.update('workbench.colorTheme', baseTheme);

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeWorkspaceConfiguration
          .get<string>("workbench.colorTheme")!
          .should.not.equal(currentTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test(`Themer should change the theme to a random dark theme when using !theme random dark`, function (done) {
    const chatMessage: ChatMessage = {
      message: "random dark",
      flags: user,
      user: "test",
      extra: standardExtra,
    };

    /* baseTheme is light.  Set now so we can be sure we get a dark theme after running the command */
    const currentTheme =
      fakeWorkspaceConfiguration.get("workbench.colorTheme") || baseTheme;
    // fakeWorkspaceConfiguration.update('workbench.colorTheme', baseTheme);

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeWorkspaceConfiguration
          .get<string>("workbench.colorTheme")!
          .should.not.equal(currentTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test(`Themer should change the theme to a random light theme when using !theme random light`, function (done) {
    const chatMessage: ChatMessage = {
      message: "random light",
      flags: user,
      user: "test",
      extra: standardExtra,
    };

    /* testTheme is dark.  Set now so we can be sure we get a light theme after running the command */
    fakeWorkspaceConfiguration.update("workbench.colorTheme", testTheme);

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeWorkspaceConfiguration
          .get<string>("workbench.colorTheme")!
          .should.not.equal(testTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test("Themer should ban a user", function (done) {
    const message = `ban mantas159159`;
    const chatMessage: ChatMessage = {
      message,
      flags: moderator,
      user: "test",
      extra: standardExtra,
    };

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeState.get<any[]>("bannedUsers")!.should.not.be.empty;
        fakeState.get<any[]>("bannedUsers")!.should.contain("mantas159159");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test("Themer should unban a user", function (done) {
    const message = `!ban mantas159159`;
    const chatMessage: ChatMessage = {
      message,
      flags: moderator,
      user: "test",
      extra: standardExtra,
    };

    fakeState.update("bannedUsers", ["test"]);
    fakeThemer = new Themer(fakeState);

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeState.get<any[]>("bannedUsers")!.should.not.contain("mantas159159");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test("Themer should not ban if user is not a moderator", function (done) {
    const message = `ban exegete46`;
    const chatMessage: ChatMessage = {
      message,
      flags: user,
      user: "test",
      extra: standardExtra,
    };

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeState.get<[]>("bannedUsers")!.should.be.empty;
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test("Themer should not unban if user is not a moderator", function (done) {
    const message = `!ban exegete46`;
    const chatMessage: ChatMessage = {
      message,
      flags: user,
      user: "test",
      extra: standardExtra,
    };

    fakeState.update("bannedUsers", ["exegete46"]);
    fakeThemer = new Themer(fakeState);

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeState.get<string>("bannedUsers")!.should.not.be.empty;
        fakeState.get<string>("bannedUsers")!.should.contain("exegete46");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test("Themer should prevent theme changes by viewers if the AccessState is set to Followers", function (done) {
    const chatMessage: ChatMessage = {
      message: testTheme,
      flags: user,
      user: "test",
      extra: standardExtra,
    };
    isTwitchUserFollowingReturn = false;

    fakeThemer.handleAccessStateChanged(AccessState.Followers);
    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeWorkspaceConfiguration
          .get<string>("workbench.colorTheme")!
          .should.equal(baseTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test("Themer should allow theme changes by followers if the AccessState is set to Followers", function (done) {
    const chatMessage: ChatMessage = {
      message: testTheme,
      flags: user,
      user: "test",
      extra: standardExtra,
    };
    isTwitchUserFollowingReturn = true;

    fakeThemer.handleAccessStateChanged(AccessState.Followers);
    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeWorkspaceConfiguration
          .get<string>("workbench.colorTheme")!
          .should.equal(testTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test("Themer should prevent theme changes by viewers if the AccessState is set to Subscribers", function (done) {
    const chatMessage: ChatMessage = {
      message: testTheme,
      flags: user,
      user: "test",
      extra: standardExtra,
    };
    isTwitchUserFollowingReturn = false;

    fakeThemer.handleAccessStateChanged(AccessState.Subscribers);
    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeWorkspaceConfiguration
          .get<string>("workbench.colorTheme")!
          .should.equal(baseTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test("Themer should prevent theme changes by followers if the AccessState is set to Subscribers", function (done) {
    const chatMessage: ChatMessage = {
      message: testTheme,
      flags: user,
      user: "test",
      extra: standardExtra,
    };
    isTwitchUserFollowingReturn = true;
    fakeThemer.handleAccessStateChanged(AccessState.Subscribers);

    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeWorkspaceConfiguration
          .get<string>("workbench.colorTheme")!
          .should.equal(baseTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test("Themer should allow theme changes by subscribers if the AccessState is set to Subscribers", function (done) {
    const chatMessage: ChatMessage = {
      message: testTheme,
      flags: subscriber,
      user: "test",
      extra: standardExtra,
    };

    fakeThemer.handleAccessStateChanged(AccessState.Subscribers);
    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeWorkspaceConfiguration
          .get<string>("workbench.colorTheme")!
          .should.equal(testTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test("Themer should prevent theme changes by subscribers if the AccessState is set to VIPs", function (done) {
    const chatMessage: ChatMessage = {
      message: testTheme,
      flags: subscriber,
      user: "test",
      extra: standardExtra,
    };

    fakeThemer.handleAccessStateChanged(AccessState.VIPs);
    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeWorkspaceConfiguration
          .get<string>("workbench.colorTheme")!
          .should.equal(baseTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test("Themer should allow theme changes by vips if the AccessState is set to VIPs", function (done) {
    const chatMessage: ChatMessage = {
      message: testTheme,
      flags: vip,
      user: "test",
      extra: standardExtra,
    };
    isTwitchUserFollowingReturn = true;

    fakeThemer.handleAccessStateChanged(AccessState.VIPs);
    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeWorkspaceConfiguration
          .get<string>("workbench.colorTheme")!
          .should.equal(testTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test("Themer should prevent theme changes by vips if the AccessState is set to Moderators", function (done) {
    const chatMessage: ChatMessage = {
      message: testTheme,
      flags: vip,
      user: "test",
      extra: standardExtra,
    };
    isTwitchUserFollowingReturn = true;

    fakeThemer.handleAccessStateChanged(AccessState.Moderators);
    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeWorkspaceConfiguration
          .get<string>("workbench.colorTheme")!
          .should.equal(baseTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test("Themer should allow theme changes by moderators if the AccessState is set to Moderators", function (done) {
    const chatMessage: ChatMessage = {
      message: testTheme,
      flags: moderator,
      user: "test",
      extra: standardExtra,
    };
    isTwitchUserFollowingReturn = true;

    fakeThemer.handleAccessStateChanged(AccessState.Moderators);
    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeWorkspaceConfiguration
          .get<string>("workbench.colorTheme")!
          .should.equal(testTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test("Themer should prevent theme changes by moderators if the AccessState is set to Broadcaster", function (done) {
    const chatMessage: ChatMessage = {
      message: testTheme,
      flags: moderator,
      user: "test",
      extra: standardExtra,
    };
    isTwitchUserFollowingReturn = true;

    fakeThemer.handleAccessStateChanged(AccessState.Broadcaster);
    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeWorkspaceConfiguration
          .get<string>("workbench.colorTheme")!
          .should.equal(baseTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  test("Themer should allow theme changes by broadcaster if the AccessState is set to Broadcaster", function (done) {
    const chatMessage: ChatMessage = {
      message: testTheme,
      flags: broadcaster,
      user: "test",
      extra: standardExtra,
    };
    isTwitchUserFollowingReturn = true;

    fakeThemer.handleAccessStateChanged(AccessState.Broadcaster);
    fakeThemer.handleCommands(chatMessage).then(() => {
      try {
        fakeWorkspaceConfiguration
          .get<string>("workbench.colorTheme")!
          .should.equal(testTheme);
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});
