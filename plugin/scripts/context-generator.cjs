"use strict";var rt=Object.create;var ne=Object.defineProperty;var nt=Object.getOwnPropertyDescriptor;var ot=Object.getOwnPropertyNames;var it=Object.getPrototypeOf,at=Object.prototype.hasOwnProperty;var dt=(d,e)=>{for(var t in e)ne(d,t,{get:e[t],enumerable:!0})},ve=(d,e,t,s)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of ot(e))!at.call(d,r)&&r!==t&&ne(d,r,{get:()=>e[r],enumerable:!(s=nt(e,r))||s.enumerable});return d};var me=(d,e,t)=>(t=d!=null?rt(it(d)):{},ve(e||!d||!d.__esModule?ne(t,"default",{value:d,enumerable:!0}):t,d)),ct=d=>ve(ne({},"__esModule",{value:!0}),d);var Nt={};dt(Nt,{generateContext:()=>Rt});module.exports=ct(Nt);var ce=me(require("path"),1),pe=require("os"),J=require("fs");var We=require("bun:sqlite");var b=require("path"),Pe=require("os"),Fe=require("fs");var je=require("url");var W=require("fs"),ke=require("path"),xe=require("os");var ye="bugfix,feature,refactor,discovery,decision,change",Me="how-it-works,why-it-exists,what-changed,problem-solution,gotcha,pattern,trade-off";var Ee=(o=>(o[o.DEBUG=0]="DEBUG",o[o.INFO=1]="INFO",o[o.WARN=2]="WARN",o[o.ERROR=3]="ERROR",o[o.SILENT=4]="SILENT",o))(Ee||{}),ge=class{level=null;useColor;constructor(){this.useColor=process.stdout.isTTY??!1}getLevel(){if(this.level===null){let e=U.get("CLAUDE_MEM_LOG_LEVEL").toUpperCase();this.level=Ee[e]??1}return this.level}correlationId(e,t){return`obs-${e}-${t}`}sessionId(e){return`session-${e}`}formatData(e){if(e==null)return"";if(typeof e=="string")return e;if(typeof e=="number"||typeof e=="boolean")return e.toString();if(typeof e=="object"){if(e instanceof Error)return this.getLevel()===0?`${e.message}
${e.stack}`:e.message;if(Array.isArray(e))return`[${e.length} items]`;let t=Object.keys(e);return t.length===0?"{}":t.length<=3?JSON.stringify(e):`{${t.length} keys: ${t.slice(0,3).join(", ")}...}`}return String(e)}formatTool(e,t){if(!t)return e;let s=typeof t=="string"?JSON.parse(t):t;if(e==="Bash"&&s.command)return`${e}(${s.command})`;if(s.file_path)return`${e}(${s.file_path})`;if(s.notebook_path)return`${e}(${s.notebook_path})`;if(e==="Glob"&&s.pattern)return`${e}(${s.pattern})`;if(e==="Grep"&&s.pattern)return`${e}(${s.pattern})`;if(s.url)return`${e}(${s.url})`;if(s.query)return`${e}(${s.query})`;if(e==="Task"){if(s.subagent_type)return`${e}(${s.subagent_type})`;if(s.description)return`${e}(${s.description})`}return e==="Skill"&&s.skill?`${e}(${s.skill})`:e==="LSP"&&s.operation?`${e}(${s.operation})`:e}formatTimestamp(e){let t=e.getFullYear(),s=String(e.getMonth()+1).padStart(2,"0"),r=String(e.getDate()).padStart(2,"0"),o=String(e.getHours()).padStart(2,"0"),i=String(e.getMinutes()).padStart(2,"0"),c=String(e.getSeconds()).padStart(2,"0"),p=String(e.getMilliseconds()).padStart(3,"0");return`${t}-${s}-${r} ${o}:${i}:${c}.${p}`}log(e,t,s,r,o){if(e<this.getLevel())return;let i=this.formatTimestamp(new Date),c=Ee[e].padEnd(5),p=t.padEnd(6),l="";r?.correlationId?l=`[${r.correlationId}] `:r?.sessionId&&(l=`[session-${r.sessionId}] `);let _="";o!=null&&(this.getLevel()===0&&typeof o=="object"?_=`
`+JSON.stringify(o,null,2):_=" "+this.formatData(o));let E="";if(r){let{sessionId:g,sdkSessionId:A,correlationId:T,...n}=r;Object.keys(n).length>0&&(E=` {${Object.entries(n).map(([R,k])=>`${R}=${k}`).join(", ")}}`)}let O=`[${i}] [${c}] [${p}] ${l}${s}${E}${_}`;e===3?console.error(O):console.log(O)}debug(e,t,s,r){this.log(0,e,t,s,r)}info(e,t,s,r){this.log(1,e,t,s,r)}warn(e,t,s,r){this.log(2,e,t,s,r)}error(e,t,s,r){this.log(3,e,t,s,r)}dataIn(e,t,s,r){this.info(e,`\u2192 ${t}`,s,r)}dataOut(e,t,s,r){this.info(e,`\u2190 ${t}`,s,r)}success(e,t,s,r){this.info(e,`\u2713 ${t}`,s,r)}failure(e,t,s,r){this.error(e,`\u2717 ${t}`,s,r)}timing(e,t,s,r){this.info(e,`\u23F1 ${t}`,r,{duration:`${s}ms`})}happyPathError(e,t,s,r,o=""){let l=((new Error().stack||"").split(`
`)[2]||"").match(/at\s+(?:.*\s+)?\(?([^:]+):(\d+):(\d+)\)?/),_=l?`${l[1].split("/").pop()}:${l[2]}`:"unknown",E={...s,location:_};return this.warn(e,`[HAPPY-PATH] ${t}`,E,r),o}},h=new ge;var U=class{static DEFAULTS={CLAUDE_MEM_MODEL:"claude-sonnet-4-5",CLAUDE_MEM_CONTEXT_OBSERVATIONS:"50",CLAUDE_MEM_WORKER_PORT:"37777",CLAUDE_MEM_WORKER_HOST:"127.0.0.1",CLAUDE_MEM_SKIP_TOOLS:"ListMcpResourcesTool,SlashCommand,Skill,TodoWrite,AskUserQuestion",CLAUDE_MEM_DATA_DIR:(0,ke.join)((0,xe.homedir)(),".claude-mem"),CLAUDE_MEM_LOG_LEVEL:"INFO",CLAUDE_MEM_PYTHON_VERSION:"3.13",CLAUDE_CODE_PATH:"",CLAUDE_MEM_MODE:"code",CLAUDE_MEM_CONTEXT_SHOW_READ_TOKENS:"true",CLAUDE_MEM_CONTEXT_SHOW_WORK_TOKENS:"true",CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_AMOUNT:"true",CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_PERCENT:"true",CLAUDE_MEM_CONTEXT_OBSERVATION_TYPES:ye,CLAUDE_MEM_CONTEXT_OBSERVATION_CONCEPTS:Me,CLAUDE_MEM_CONTEXT_FULL_COUNT:"5",CLAUDE_MEM_CONTEXT_FULL_FIELD:"narrative",CLAUDE_MEM_CONTEXT_SESSION_COUNT:"10",CLAUDE_MEM_CONTEXT_SHOW_LAST_SUMMARY:"true",CLAUDE_MEM_CONTEXT_SHOW_LAST_MESSAGE:"false"};static getAllDefaults(){return{...this.DEFAULTS}}static get(e){return this.DEFAULTS[e]}static getInt(e){let t=this.get(e);return parseInt(t,10)}static getBool(e){return this.get(e)==="true"}static loadFromFile(e){try{if(!(0,W.existsSync)(e))return this.getAllDefaults();let t=(0,W.readFileSync)(e,"utf-8"),s=JSON.parse(t),r=s;if(s.env&&typeof s.env=="object"){r=s.env;try{(0,W.writeFileSync)(e,JSON.stringify(r,null,2),"utf-8"),h.info("SETTINGS","Migrated settings file from nested to flat schema",{settingsPath:e})}catch(i){h.warn("SETTINGS","Failed to auto-migrate settings file",{settingsPath:e},i)}}let o={...this.DEFAULTS};for(let i of Object.keys(this.DEFAULTS))r[i]!==void 0&&(o[i]=r[i]);return o}catch(t){return h.warn("SETTINGS","Failed to load settings, using defaults",{settingsPath:e},t),this.getAllDefaults()}}};var G=require("fs"),M=require("path"),B=require("os"),$e=require("child_process"),pt={id:"claude-code",name:"Claude Code",paths:{configDir:process.env.CLAUDE_CONFIG_DIR||(0,M.join)((0,B.homedir)(),".claude"),dataDir:(0,M.join)((0,B.homedir)(),".claude-mem"),pluginDir:(0,M.join)((0,B.homedir)(),".claude","plugins"),marketplaceDir:(0,M.join)((0,B.homedir)(),".claude","plugins","marketplaces","thedotmack")},env:{pluginRootVar:"CLAUDE_PLUGIN_ROOT",configDirVar:"CLAUDE_CONFIG_DIR",dataDirVar:"CLAUDE_MEM_DATA_DIR"},hookEvents:{"session.start":"SessionStart","session.end":"SessionEnd","user.prompt":"UserPromptSubmit","tool.after":"PostToolUse","agent.stop":"Stop","context.inject":"SessionStart"},exitCodes:{success:0,failure:1,infoOnly:3},defaults:{skipTools:["ListMcpResourcesTool","SlashCommand","Skill","TodoWrite","AskUserQuestion"],settingsPrefix:"CLAUDE_MEM_",workerPort:37777,model:"claude-sonnet-4-5"}},V=class{config=pt;skipToolsSet;constructor(){this.skipToolsSet=new Set(this.config.defaults.skipTools)}parseSessionInput(e){let t=e.trim()?JSON.parse(e):{};return{sessionId:t.session_id||"",projectName:this.getProjectName(t.cwd||process.cwd()),workingDir:t.cwd||process.cwd(),transcriptPath:t.transcript_path,metadata:{hookEventName:t.hook_event_name}}}parseObservationInput(e){let t=JSON.parse(e);return{sessionId:t.session_id,toolName:t.tool_name,toolInput:t.tool_input,toolOutput:t.tool_response,workingDir:t.cwd}}parseSummaryInput(e){let t=JSON.parse(e),s={sessionId:t.session_id,transcriptPath:t.transcript_path};if(t.transcript_path){let r=this.getLastMessage(t.transcript_path,"user"),o=this.getLastMessage(t.transcript_path,"assistant",!0);r&&(s.lastUserMessage=r.content),o&&(s.lastAssistantMessage=o.content)}return s}parsePromptInput(e){let t=JSON.parse(e);return{sessionId:t.session_id,projectName:this.getProjectName(t.cwd),workingDir:t.cwd,prompt:t.prompt}}parseSessionEndInput(e){let t=JSON.parse(e);return{sessionId:t.session_id,reason:t.reason}}formatHookOutput(e,t){return e==="context.inject"&&t.context?JSON.stringify({hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:t.context}}):JSON.stringify({continue:t.continue??!0,suppressOutput:t.suppressOutput??!0})}getExitCode(e){switch(e){case"success":return this.config.exitCodes.success;case"failure":return this.config.exitCodes.failure;case"info":return this.config.exitCodes.infoOnly??3}}supportsTranscriptParsing(){return!0}parseTranscript(e){if(!(0,G.existsSync)(e))throw new Error(`Transcript file not found: ${e}`);let t=(0,G.readFileSync)(e,"utf-8").trim();if(!t)return[];let s=t.split(`
`),r=[];for(let o of s)try{let i=JSON.parse(o);(i.type==="user"||i.type==="assistant")&&r.push({role:i.type,content:this.extractMessageContent(i.message?.content),timestamp:i.timestamp,metadata:i})}catch{}return r}getLastMessage(e,t,s=!1){if(!(0,G.existsSync)(e))return null;let r=(0,G.readFileSync)(e,"utf-8").trim();if(!r)return null;let o=r.split(`
`);for(let i=o.length-1;i>=0;i--)try{let c=JSON.parse(o[i]);if(c.type===t&&c.message?.content){let p=this.extractMessageContent(c.message.content);return s&&(p=p.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g,""),p=p.replace(/\n{3,}/g,`

`).trim()),{role:t,content:p,timestamp:c.timestamp,metadata:c}}}catch{}return null}extractMessageContent(e){return typeof e=="string"?e:Array.isArray(e)?e.filter(t=>t.type==="text").map(t=>t.text||"").join(`
`):""}getPaths(){let e=process.env[this.config.env.configDirVar]||this.config.paths.configDir,t=process.env[this.config.env.dataDirVar]||this.config.paths.dataDir;return{configDir:e,dataDir:t,pluginDir:this.config.paths.pluginDir,marketplaceDir:this.config.paths.marketplaceDir}}getProjectName(e){try{let t=(0,$e.execSync)("git rev-parse --show-toplevel",{cwd:e,encoding:"utf8",stdio:["pipe","pipe","ignore"],windowsHide:!0}).trim();return(0,M.basename)(t)}catch{return(0,M.basename)(e)}}shouldSkipTool(e){return this.skipToolsSet.has(e)}getSkippedTools(){return[...this.skipToolsSet]}getSettingsPrefix(){return this.config.defaults.settingsPrefix}getDefaultWorkerPort(){return this.config.defaults.workerPort}};function Te(){return!!process.env.CLAUDE_PLUGIN_ROOT||!!process.env.CLAUDE_CONFIG_DIR||(0,G.existsSync)((0,M.join)((0,B.homedir)(),".claude"))}function he(){return new V}var K=require("fs"),D=require("path"),Y=require("os"),Ue=require("child_process"),ut={id:"opencode",name:"OpenCode",paths:{configDir:process.env.XDG_CONFIG_HOME?(0,D.join)(process.env.XDG_CONFIG_HOME,"opencode"):(0,D.join)((0,Y.homedir)(),".config","opencode"),dataDir:(0,D.join)((0,Y.homedir)(),".opencode-mem"),pluginDir:(0,D.join)((0,Y.homedir)(),".opencode","plugins")},env:{pluginRootVar:"OPENCODE_PLUGIN_ROOT",configDirVar:"OPENCODE_CONFIG_DIR",dataDirVar:"OPENCODE_MEM_DATA_DIR"},hookEvents:{"session.start":"session.created","session.end":"session.deleted","user.prompt":"chat.message","tool.before":"tool.execute.before","tool.after":"tool.execute.after","agent.stop":"session.idle","context.inject":"session.created"},exitCodes:{success:0,failure:1,infoOnly:0},defaults:{skipTools:[],settingsPrefix:"OPENCODE_MEM_",workerPort:37777,model:"claude-sonnet-4-5"}},Q=class{config=ut;skipToolsSet;constructor(){this.skipToolsSet=new Set(this.config.defaults.skipTools)}parseSessionInput(e){let t=e.trim()?JSON.parse(e):{},s=t.directory||t.worktree||process.cwd();return{sessionId:t.sessionID||"",projectName:t.project||this.getProjectName(s),workingDir:s,metadata:{worktree:t.worktree}}}parseObservationInput(e){let t=JSON.parse(e),s=t.input||t,r=t.output||{};return{sessionId:s.sessionID,toolName:s.tool,toolInput:r.args,toolOutput:r.output||r.metadata,workingDir:process.cwd(),callId:s.callID,metadata:{title:r.title}}}parseSummaryInput(e){return{sessionId:JSON.parse(e).sessionID}}parsePromptInput(e){let t=JSON.parse(e),s=t.input||t,r=t.output||{};return{sessionId:s.sessionID,projectName:this.getProjectName(process.cwd()),workingDir:process.cwd(),prompt:r.message?.content||"",metadata:{agent:s.agent,model:s.model,messageID:s.messageID}}}parseSessionEndInput(e){let t=JSON.parse(e);return{sessionId:t.sessionID,reason:t.reason||"other"}}formatHookOutput(e,t){return t.context?JSON.stringify({context:t.context,source:"opencode-mem"}):JSON.stringify({success:!0})}getExitCode(e){switch(e){case"success":case"info":return this.config.exitCodes.success;case"failure":return this.config.exitCodes.failure}}supportsTranscriptParsing(){return!0}parseTranscript(e){if(!(0,K.existsSync)(e))throw new Error(`Transcript file not found: ${e}`);let t=(0,K.readFileSync)(e,"utf-8"),s=JSON.parse(t);return!s.messages||!Array.isArray(s.messages)?[]:s.messages.map(r=>({role:r.role,content:r.content||this.extractPartsContent(r.parts),timestamp:r.time?.created}))}extractPartsContent(e){return!e||!Array.isArray(e)?"":e.filter(t=>t.text).map(t=>t.text).join(`
`)}getLastMessage(e,t,s=!1){let o=this.parseTranscript(e).filter(i=>i.role===t);return o.length>0?o[o.length-1]:null}getPaths(){let e=process.env[this.config.env.configDirVar]||this.config.paths.configDir,t=process.env[this.config.env.dataDirVar]||this.config.paths.dataDir;return{configDir:e,dataDir:t,pluginDir:this.config.paths.pluginDir}}getProjectName(e){try{let t=(0,Ue.execSync)("git rev-parse --show-toplevel",{cwd:e,encoding:"utf8",stdio:["pipe","pipe","ignore"],windowsHide:!0}).trim();return(0,D.basename)(t)}catch{return(0,D.basename)(e)}}shouldSkipTool(e){return this.skipToolsSet.has(e)}getSkippedTools(){return[...this.skipToolsSet]}getSettingsPrefix(){return this.config.defaults.settingsPrefix}getDefaultWorkerPort(){return this.config.defaults.workerPort}};function fe(){return!!process.env.OPENCODE_PLUGIN_ROOT||!!process.env.OPENCODE_CONFIG||(0,K.existsSync)((0,D.join)((0,Y.homedir)(),".opencode.json"))||(0,K.existsSync)((0,D.join)((0,Y.homedir)(),".config","opencode"))}function Se(){return new Q}var oe=[],lt=null,_t=null;function we(d,e,t,s){let r=oe.findIndex(o=>o.id===d);r!==-1?oe[r]={id:d,priority:e,detect:t,create:s}:oe.push({id:d,priority:e,detect:t,create:s}),oe.sort((o,i)=>i.priority-o.priority),lt=null,_t=null}we("claude-code",100,Te,he);we("opencode",90,fe,Se);var gt={};function mt(){return typeof __dirname<"u"?__dirname:(0,b.dirname)((0,je.fileURLToPath)(gt.url))}var Et=mt(),v=U.get("CLAUDE_MEM_DATA_DIR"),be=process.env.CLAUDE_CONFIG_DIR||(0,b.join)((0,Pe.homedir)(),".claude"),zt=(0,b.join)(v,"archives"),Zt=(0,b.join)(v,"logs"),es=(0,b.join)(v,"trash"),ts=(0,b.join)(v,"backups"),ss=(0,b.join)(v,"modes"),rs=(0,b.join)(v,"settings.json"),Ge=(0,b.join)(v,"claude-mem.db"),ns=(0,b.join)(v,"vector-db"),os=(0,b.join)(be,"settings.json"),is=(0,b.join)(be,"commands"),as=(0,b.join)(be,"CLAUDE.md");function Xe(d){(0,Fe.mkdirSync)(d,{recursive:!0})}function He(){return(0,b.join)(Et,"..")}var ie=class{db;constructor(){Xe(v),this.db=new We.Database(Ge),this.db.run("PRAGMA journal_mode = WAL"),this.db.run("PRAGMA synchronous = NORMAL"),this.db.run("PRAGMA foreign_keys = ON"),this.initializeSchema(),this.ensureWorkerPortColumn(),this.ensurePromptTrackingColumns(),this.removeSessionSummariesUniqueConstraint(),this.addObservationHierarchicalFields(),this.makeObservationsTextNullable(),this.createUserPromptsTable(),this.ensureDiscoveryTokensColumn(),this.createPendingMessagesTable()}initializeSchema(){try{this.db.run(`
        CREATE TABLE IF NOT EXISTS schema_versions (
          id INTEGER PRIMARY KEY,
          version INTEGER UNIQUE NOT NULL,
          applied_at TEXT NOT NULL
        )
      `);let e=this.db.prepare("SELECT version FROM schema_versions ORDER BY version").all();(e.length>0?Math.max(...e.map(s=>s.version)):0)===0&&(console.log("[SessionStore] Initializing fresh database with migration004..."),this.db.run(`
          CREATE TABLE IF NOT EXISTS sdk_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            claude_session_id TEXT UNIQUE NOT NULL,
            sdk_session_id TEXT UNIQUE,
            project TEXT NOT NULL,
            user_prompt TEXT,
            started_at TEXT NOT NULL,
            started_at_epoch INTEGER NOT NULL,
            completed_at TEXT,
            completed_at_epoch INTEGER,
            status TEXT CHECK(status IN ('active', 'completed', 'failed')) NOT NULL DEFAULT 'active'
          );

          CREATE INDEX IF NOT EXISTS idx_sdk_sessions_claude_id ON sdk_sessions(claude_session_id);
          CREATE INDEX IF NOT EXISTS idx_sdk_sessions_sdk_id ON sdk_sessions(sdk_session_id);
          CREATE INDEX IF NOT EXISTS idx_sdk_sessions_project ON sdk_sessions(project);
          CREATE INDEX IF NOT EXISTS idx_sdk_sessions_status ON sdk_sessions(status);
          CREATE INDEX IF NOT EXISTS idx_sdk_sessions_started ON sdk_sessions(started_at_epoch DESC);

          CREATE TABLE IF NOT EXISTS observations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sdk_session_id TEXT NOT NULL,
            project TEXT NOT NULL,
            text TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('decision', 'bugfix', 'feature', 'refactor', 'discovery')),
            created_at TEXT NOT NULL,
            created_at_epoch INTEGER NOT NULL,
            FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
          );

          CREATE INDEX IF NOT EXISTS idx_observations_sdk_session ON observations(sdk_session_id);
          CREATE INDEX IF NOT EXISTS idx_observations_project ON observations(project);
          CREATE INDEX IF NOT EXISTS idx_observations_type ON observations(type);
          CREATE INDEX IF NOT EXISTS idx_observations_created ON observations(created_at_epoch DESC);

          CREATE TABLE IF NOT EXISTS session_summaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sdk_session_id TEXT UNIQUE NOT NULL,
            project TEXT NOT NULL,
            request TEXT,
            investigated TEXT,
            learned TEXT,
            completed TEXT,
            next_steps TEXT,
            files_read TEXT,
            files_edited TEXT,
            notes TEXT,
            created_at TEXT NOT NULL,
            created_at_epoch INTEGER NOT NULL,
            FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
          );

          CREATE INDEX IF NOT EXISTS idx_session_summaries_sdk_session ON session_summaries(sdk_session_id);
          CREATE INDEX IF NOT EXISTS idx_session_summaries_project ON session_summaries(project);
          CREATE INDEX IF NOT EXISTS idx_session_summaries_created ON session_summaries(created_at_epoch DESC);
        `),this.db.prepare("INSERT INTO schema_versions (version, applied_at) VALUES (?, ?)").run(4,new Date().toISOString()),console.log("[SessionStore] Migration004 applied successfully"))}catch(e){throw console.error("[SessionStore] Schema initialization error:",e.message),e}}ensureWorkerPortColumn(){if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(5))return;this.db.query("PRAGMA table_info(sdk_sessions)").all().some(r=>r.name==="worker_port")||(this.db.run("ALTER TABLE sdk_sessions ADD COLUMN worker_port INTEGER"),console.log("[SessionStore] Added worker_port column to sdk_sessions table")),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(5,new Date().toISOString())}ensurePromptTrackingColumns(){if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(6))return;this.db.query("PRAGMA table_info(sdk_sessions)").all().some(p=>p.name==="prompt_counter")||(this.db.run("ALTER TABLE sdk_sessions ADD COLUMN prompt_counter INTEGER DEFAULT 0"),console.log("[SessionStore] Added prompt_counter column to sdk_sessions table")),this.db.query("PRAGMA table_info(observations)").all().some(p=>p.name==="prompt_number")||(this.db.run("ALTER TABLE observations ADD COLUMN prompt_number INTEGER"),console.log("[SessionStore] Added prompt_number column to observations table")),this.db.query("PRAGMA table_info(session_summaries)").all().some(p=>p.name==="prompt_number")||(this.db.run("ALTER TABLE session_summaries ADD COLUMN prompt_number INTEGER"),console.log("[SessionStore] Added prompt_number column to session_summaries table")),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(6,new Date().toISOString())}removeSessionSummariesUniqueConstraint(){if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(7))return;if(!this.db.query("PRAGMA index_list(session_summaries)").all().some(r=>r.unique===1)){this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(7,new Date().toISOString());return}console.log("[SessionStore] Removing UNIQUE constraint from session_summaries.sdk_session_id..."),this.db.run("BEGIN TRANSACTION");try{this.db.run(`
        CREATE TABLE session_summaries_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sdk_session_id TEXT NOT NULL,
          project TEXT NOT NULL,
          request TEXT,
          investigated TEXT,
          learned TEXT,
          completed TEXT,
          next_steps TEXT,
          files_read TEXT,
          files_edited TEXT,
          notes TEXT,
          prompt_number INTEGER,
          created_at TEXT NOT NULL,
          created_at_epoch INTEGER NOT NULL,
          FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
        )
      `),this.db.run(`
        INSERT INTO session_summaries_new
        SELECT id, sdk_session_id, project, request, investigated, learned,
               completed, next_steps, files_read, files_edited, notes,
               prompt_number, created_at, created_at_epoch
        FROM session_summaries
      `),this.db.run("DROP TABLE session_summaries"),this.db.run("ALTER TABLE session_summaries_new RENAME TO session_summaries"),this.db.run(`
        CREATE INDEX idx_session_summaries_sdk_session ON session_summaries(sdk_session_id);
        CREATE INDEX idx_session_summaries_project ON session_summaries(project);
        CREATE INDEX idx_session_summaries_created ON session_summaries(created_at_epoch DESC);
      `),this.db.run("COMMIT"),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(7,new Date().toISOString()),console.log("[SessionStore] Successfully removed UNIQUE constraint from session_summaries.sdk_session_id")}catch(r){throw this.db.run("ROLLBACK"),r}}addObservationHierarchicalFields(){if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(8))return;if(this.db.query("PRAGMA table_info(observations)").all().some(r=>r.name==="title")){this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(8,new Date().toISOString());return}console.log("[SessionStore] Adding hierarchical fields to observations table..."),this.db.run(`
      ALTER TABLE observations ADD COLUMN title TEXT;
      ALTER TABLE observations ADD COLUMN subtitle TEXT;
      ALTER TABLE observations ADD COLUMN facts TEXT;
      ALTER TABLE observations ADD COLUMN narrative TEXT;
      ALTER TABLE observations ADD COLUMN concepts TEXT;
      ALTER TABLE observations ADD COLUMN files_read TEXT;
      ALTER TABLE observations ADD COLUMN files_modified TEXT;
    `),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(8,new Date().toISOString()),console.log("[SessionStore] Successfully added hierarchical fields to observations table")}makeObservationsTextNullable(){if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(9))return;let s=this.db.query("PRAGMA table_info(observations)").all().find(r=>r.name==="text");if(!s||s.notnull===0){this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(9,new Date().toISOString());return}console.log("[SessionStore] Making observations.text nullable..."),this.db.run("BEGIN TRANSACTION");try{this.db.run(`
        CREATE TABLE observations_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sdk_session_id TEXT NOT NULL,
          project TEXT NOT NULL,
          text TEXT,
          type TEXT NOT NULL CHECK(type IN ('decision', 'bugfix', 'feature', 'refactor', 'discovery', 'change')),
          title TEXT,
          subtitle TEXT,
          facts TEXT,
          narrative TEXT,
          concepts TEXT,
          files_read TEXT,
          files_modified TEXT,
          prompt_number INTEGER,
          created_at TEXT NOT NULL,
          created_at_epoch INTEGER NOT NULL,
          FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
        )
      `),this.db.run(`
        INSERT INTO observations_new
        SELECT id, sdk_session_id, project, text, type, title, subtitle, facts,
               narrative, concepts, files_read, files_modified, prompt_number,
               created_at, created_at_epoch
        FROM observations
      `),this.db.run("DROP TABLE observations"),this.db.run("ALTER TABLE observations_new RENAME TO observations"),this.db.run(`
        CREATE INDEX idx_observations_sdk_session ON observations(sdk_session_id);
        CREATE INDEX idx_observations_project ON observations(project);
        CREATE INDEX idx_observations_type ON observations(type);
        CREATE INDEX idx_observations_created ON observations(created_at_epoch DESC);
      `),this.db.run("COMMIT"),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(9,new Date().toISOString()),console.log("[SessionStore] Successfully made observations.text nullable")}catch(r){throw this.db.run("ROLLBACK"),r}}createUserPromptsTable(){if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(10))return;if(this.db.query("PRAGMA table_info(user_prompts)").all().length>0){this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(10,new Date().toISOString());return}console.log("[SessionStore] Creating user_prompts table with FTS5 support..."),this.db.run("BEGIN TRANSACTION");try{this.db.run(`
        CREATE TABLE user_prompts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          claude_session_id TEXT NOT NULL,
          prompt_number INTEGER NOT NULL,
          prompt_text TEXT NOT NULL,
          created_at TEXT NOT NULL,
          created_at_epoch INTEGER NOT NULL,
          FOREIGN KEY(claude_session_id) REFERENCES sdk_sessions(claude_session_id) ON DELETE CASCADE
        );

        CREATE INDEX idx_user_prompts_claude_session ON user_prompts(claude_session_id);
        CREATE INDEX idx_user_prompts_created ON user_prompts(created_at_epoch DESC);
        CREATE INDEX idx_user_prompts_prompt_number ON user_prompts(prompt_number);
        CREATE INDEX idx_user_prompts_lookup ON user_prompts(claude_session_id, prompt_number);
      `),this.db.run(`
        CREATE VIRTUAL TABLE user_prompts_fts USING fts5(
          prompt_text,
          content='user_prompts',
          content_rowid='id'
        );
      `),this.db.run(`
        CREATE TRIGGER user_prompts_ai AFTER INSERT ON user_prompts BEGIN
          INSERT INTO user_prompts_fts(rowid, prompt_text)
          VALUES (new.id, new.prompt_text);
        END;

        CREATE TRIGGER user_prompts_ad AFTER DELETE ON user_prompts BEGIN
          INSERT INTO user_prompts_fts(user_prompts_fts, rowid, prompt_text)
          VALUES('delete', old.id, old.prompt_text);
        END;

        CREATE TRIGGER user_prompts_au AFTER UPDATE ON user_prompts BEGIN
          INSERT INTO user_prompts_fts(user_prompts_fts, rowid, prompt_text)
          VALUES('delete', old.id, old.prompt_text);
          INSERT INTO user_prompts_fts(rowid, prompt_text)
          VALUES (new.id, new.prompt_text);
        END;
      `),this.db.run("COMMIT"),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(10,new Date().toISOString()),console.log("[SessionStore] Successfully created user_prompts table with FTS5 support")}catch(s){throw this.db.run("ROLLBACK"),s}}ensureDiscoveryTokensColumn(){try{if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(11))return;this.db.query("PRAGMA table_info(observations)").all().some(i=>i.name==="discovery_tokens")||(this.db.run("ALTER TABLE observations ADD COLUMN discovery_tokens INTEGER DEFAULT 0"),console.log("[SessionStore] Added discovery_tokens column to observations table")),this.db.query("PRAGMA table_info(session_summaries)").all().some(i=>i.name==="discovery_tokens")||(this.db.run("ALTER TABLE session_summaries ADD COLUMN discovery_tokens INTEGER DEFAULT 0"),console.log("[SessionStore] Added discovery_tokens column to session_summaries table")),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(11,new Date().toISOString())}catch(e){throw console.error("[SessionStore] Discovery tokens migration error:",e.message),e}}createPendingMessagesTable(){try{if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(16))return;if(this.db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='pending_messages'").all().length>0){this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(16,new Date().toISOString());return}console.log("[SessionStore] Creating pending_messages table..."),this.db.run(`
        CREATE TABLE pending_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_db_id INTEGER NOT NULL,
          claude_session_id TEXT NOT NULL,
          message_type TEXT NOT NULL CHECK(message_type IN ('observation', 'summarize')),
          tool_name TEXT,
          tool_input TEXT,
          tool_response TEXT,
          cwd TEXT,
          last_user_message TEXT,
          last_assistant_message TEXT,
          prompt_number INTEGER,
          status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'processed', 'failed')),
          retry_count INTEGER NOT NULL DEFAULT 0,
          created_at_epoch INTEGER NOT NULL,
          started_processing_at_epoch INTEGER,
          completed_at_epoch INTEGER,
          FOREIGN KEY (session_db_id) REFERENCES sdk_sessions(id) ON DELETE CASCADE
        )
      `),this.db.run("CREATE INDEX IF NOT EXISTS idx_pending_messages_session ON pending_messages(session_db_id)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_pending_messages_status ON pending_messages(status)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_pending_messages_claude_session ON pending_messages(claude_session_id)"),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(16,new Date().toISOString()),console.log("[SessionStore] pending_messages table created successfully")}catch(e){throw console.error("[SessionStore] Pending messages table migration error:",e.message),e}}getRecentSummaries(e,t=10){return this.db.prepare(`
      SELECT
        request, investigated, learned, completed, next_steps,
        files_read, files_edited, notes, prompt_number, created_at
      FROM session_summaries
      WHERE project = ?
      ORDER BY created_at_epoch DESC
      LIMIT ?
    `).all(e,t)}getRecentSummariesWithSessionInfo(e,t=3){return this.db.prepare(`
      SELECT
        sdk_session_id, request, learned, completed, next_steps,
        prompt_number, created_at
      FROM session_summaries
      WHERE project = ?
      ORDER BY created_at_epoch DESC
      LIMIT ?
    `).all(e,t)}getRecentObservations(e,t=20){return this.db.prepare(`
      SELECT type, text, prompt_number, created_at
      FROM observations
      WHERE project = ?
      ORDER BY created_at_epoch DESC
      LIMIT ?
    `).all(e,t)}getAllRecentObservations(e=100){return this.db.prepare(`
      SELECT id, type, title, subtitle, text, project, prompt_number, created_at, created_at_epoch
      FROM observations
      ORDER BY created_at_epoch DESC
      LIMIT ?
    `).all(e)}getAllRecentSummaries(e=50){return this.db.prepare(`
      SELECT id, request, investigated, learned, completed, next_steps,
             files_read, files_edited, notes, project, prompt_number,
             created_at, created_at_epoch
      FROM session_summaries
      ORDER BY created_at_epoch DESC
      LIMIT ?
    `).all(e)}getAllRecentUserPrompts(e=100){return this.db.prepare(`
      SELECT
        up.id,
        up.claude_session_id,
        s.project,
        up.prompt_number,
        up.prompt_text,
        up.created_at,
        up.created_at_epoch
      FROM user_prompts up
      LEFT JOIN sdk_sessions s ON up.claude_session_id = s.claude_session_id
      ORDER BY up.created_at_epoch DESC
      LIMIT ?
    `).all(e)}getAllProjects(){return this.db.prepare(`
      SELECT DISTINCT project
      FROM sdk_sessions
      WHERE project IS NOT NULL AND project != ''
      ORDER BY project ASC
    `).all().map(s=>s.project)}getLatestUserPrompt(e){return this.db.prepare(`
      SELECT
        up.*,
        s.sdk_session_id,
        s.project
      FROM user_prompts up
      JOIN sdk_sessions s ON up.claude_session_id = s.claude_session_id
      WHERE up.claude_session_id = ?
      ORDER BY up.created_at_epoch DESC
      LIMIT 1
    `).get(e)}getRecentSessionsWithStatus(e,t=3){return this.db.prepare(`
      SELECT * FROM (
        SELECT
          s.sdk_session_id,
          s.status,
          s.started_at,
          s.started_at_epoch,
          s.user_prompt,
          CASE WHEN sum.sdk_session_id IS NOT NULL THEN 1 ELSE 0 END as has_summary
        FROM sdk_sessions s
        LEFT JOIN session_summaries sum ON s.sdk_session_id = sum.sdk_session_id
        WHERE s.project = ? AND s.sdk_session_id IS NOT NULL
        GROUP BY s.sdk_session_id
        ORDER BY s.started_at_epoch DESC
        LIMIT ?
      )
      ORDER BY started_at_epoch ASC
    `).all(e,t)}getObservationsForSession(e){return this.db.prepare(`
      SELECT title, subtitle, type, prompt_number
      FROM observations
      WHERE sdk_session_id = ?
      ORDER BY created_at_epoch ASC
    `).all(e)}getObservationById(e){return this.db.prepare(`
      SELECT *
      FROM observations
      WHERE id = ?
    `).get(e)||null}getObservationsByIds(e,t={}){if(e.length===0)return[];let{orderBy:s="date_desc",limit:r,project:o,type:i,concepts:c,files:p}=t,l=s==="date_asc"?"ASC":"DESC",_=r?`LIMIT ${r}`:"",E=e.map(()=>"?").join(","),O=[...e],g=[];if(o&&(g.push("project = ?"),O.push(o)),i)if(Array.isArray(i)){let n=i.map(()=>"?").join(",");g.push(`type IN (${n})`),O.push(...i)}else g.push("type = ?"),O.push(i);if(c){let n=Array.isArray(c)?c:[c],I=n.map(()=>"EXISTS (SELECT 1 FROM json_each(concepts) WHERE value = ?)");O.push(...n),g.push(`(${I.join(" OR ")})`)}if(p){let n=Array.isArray(p)?p:[p],I=n.map(()=>"(EXISTS (SELECT 1 FROM json_each(files_read) WHERE value LIKE ?) OR EXISTS (SELECT 1 FROM json_each(files_modified) WHERE value LIKE ?))");n.forEach(R=>{O.push(`%${R}%`,`%${R}%`)}),g.push(`(${I.join(" OR ")})`)}let A=g.length>0?`WHERE id IN (${E}) AND ${g.join(" AND ")}`:`WHERE id IN (${E})`;return this.db.prepare(`
      SELECT *
      FROM observations
      ${A}
      ORDER BY created_at_epoch ${l}
      ${_}
    `).all(...O)}getSummaryForSession(e){return this.db.prepare(`
      SELECT
        request, investigated, learned, completed, next_steps,
        files_read, files_edited, notes, prompt_number, created_at
      FROM session_summaries
      WHERE sdk_session_id = ?
      ORDER BY created_at_epoch DESC
      LIMIT 1
    `).get(e)||null}getFilesForSession(e){let s=this.db.prepare(`
      SELECT files_read, files_modified
      FROM observations
      WHERE sdk_session_id = ?
    `).all(e),r=new Set,o=new Set;for(let i of s){if(i.files_read){let c=JSON.parse(i.files_read);Array.isArray(c)&&c.forEach(p=>r.add(p))}if(i.files_modified){let c=JSON.parse(i.files_modified);Array.isArray(c)&&c.forEach(p=>o.add(p))}}return{filesRead:Array.from(r),filesModified:Array.from(o)}}getSessionById(e){return this.db.prepare(`
      SELECT id, claude_session_id, sdk_session_id, project, user_prompt
      FROM sdk_sessions
      WHERE id = ?
      LIMIT 1
    `).get(e)||null}getSdkSessionsBySessionIds(e){if(e.length===0)return[];let t=e.map(()=>"?").join(",");return this.db.prepare(`
      SELECT id, claude_session_id, sdk_session_id, project, user_prompt,
             started_at, started_at_epoch, completed_at, completed_at_epoch, status
      FROM sdk_sessions
      WHERE sdk_session_id IN (${t})
      ORDER BY started_at_epoch DESC
    `).all(...e)}findActiveSDKSession(e){return this.db.prepare(`
      SELECT id, sdk_session_id, project, worker_port
      FROM sdk_sessions
      WHERE claude_session_id = ? AND status = 'active'
      LIMIT 1
    `).get(e)||null}findAnySDKSession(e){return this.db.prepare(`
      SELECT id
      FROM sdk_sessions
      WHERE claude_session_id = ?
      LIMIT 1
    `).get(e)||null}reactivateSession(e,t){this.db.prepare(`
      UPDATE sdk_sessions
      SET status = 'active', user_prompt = ?, worker_port = NULL
      WHERE id = ?
    `).run(t,e)}incrementPromptCounter(e){return this.db.prepare(`
      UPDATE sdk_sessions
      SET prompt_counter = COALESCE(prompt_counter, 0) + 1
      WHERE id = ?
    `).run(e),this.db.prepare(`
      SELECT prompt_counter FROM sdk_sessions WHERE id = ?
    `).get(e)?.prompt_counter||1}getPromptCounter(e){return this.db.prepare(`
      SELECT prompt_counter FROM sdk_sessions WHERE id = ?
    `).get(e)?.prompt_counter||0}createSDKSession(e,t,s){let r=new Date,o=r.getTime(),c=this.db.prepare(`
      INSERT OR IGNORE INTO sdk_sessions
      (claude_session_id, sdk_session_id, project, user_prompt, started_at, started_at_epoch, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `).run(e,e,t,s,r.toISOString(),o);return c.lastInsertRowid===0||c.changes===0?(t&&t.trim()!==""&&this.db.prepare(`
          UPDATE sdk_sessions
          SET project = ?, user_prompt = ?
          WHERE claude_session_id = ?
        `).run(t,s,e),this.db.prepare(`
        SELECT id FROM sdk_sessions WHERE claude_session_id = ? LIMIT 1
      `).get(e).id):c.lastInsertRowid}updateSDKSessionId(e,t){return this.db.prepare(`
      UPDATE sdk_sessions
      SET sdk_session_id = ?
      WHERE id = ? AND sdk_session_id IS NULL
    `).run(t,e).changes===0?(h.debug("DB","sdk_session_id already set, skipping update",{sessionId:e,sdkSessionId:t}),!1):!0}setWorkerPort(e,t){this.db.prepare(`
      UPDATE sdk_sessions
      SET worker_port = ?
      WHERE id = ?
    `).run(t,e)}getWorkerPort(e){return this.db.prepare(`
      SELECT worker_port
      FROM sdk_sessions
      WHERE id = ?
      LIMIT 1
    `).get(e)?.worker_port||null}saveUserPrompt(e,t,s){let r=new Date,o=r.getTime();return this.db.prepare(`
      INSERT INTO user_prompts
      (claude_session_id, prompt_number, prompt_text, created_at, created_at_epoch)
      VALUES (?, ?, ?, ?, ?)
    `).run(e,t,s,r.toISOString(),o).lastInsertRowid}getUserPrompt(e,t){return this.db.prepare(`
      SELECT prompt_text
      FROM user_prompts
      WHERE claude_session_id = ? AND prompt_number = ?
      LIMIT 1
    `).get(e,t)?.prompt_text??null}storeObservation(e,t,s,r,o=0){let i=new Date,c=i.getTime();this.db.prepare(`
      SELECT id FROM sdk_sessions WHERE sdk_session_id = ?
    `).get(e)||(this.db.prepare(`
        INSERT INTO sdk_sessions
        (claude_session_id, sdk_session_id, project, started_at, started_at_epoch, status)
        VALUES (?, ?, ?, ?, ?, 'active')
      `).run(e,e,t,i.toISOString(),c),console.log(`[SessionStore] Auto-created session record for session_id: ${e}`));let E=this.db.prepare(`
      INSERT INTO observations
      (sdk_session_id, project, type, title, subtitle, facts, narrative, concepts,
       files_read, files_modified, prompt_number, discovery_tokens, created_at, created_at_epoch)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(e,t,s.type,s.title,s.subtitle,JSON.stringify(s.facts),s.narrative,JSON.stringify(s.concepts),JSON.stringify(s.files_read),JSON.stringify(s.files_modified),r||null,o,i.toISOString(),c);return{id:Number(E.lastInsertRowid),createdAtEpoch:c}}storeSummary(e,t,s,r,o=0){let i=new Date,c=i.getTime();this.db.prepare(`
      SELECT id FROM sdk_sessions WHERE sdk_session_id = ?
    `).get(e)||(this.db.prepare(`
        INSERT INTO sdk_sessions
        (claude_session_id, sdk_session_id, project, started_at, started_at_epoch, status)
        VALUES (?, ?, ?, ?, ?, 'active')
      `).run(e,e,t,i.toISOString(),c),console.log(`[SessionStore] Auto-created session record for session_id: ${e}`));let E=this.db.prepare(`
      INSERT INTO session_summaries
      (sdk_session_id, project, request, investigated, learned, completed,
       next_steps, notes, prompt_number, discovery_tokens, created_at, created_at_epoch)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(e,t,s.request,s.investigated,s.learned,s.completed,s.next_steps,s.notes,r||null,o,i.toISOString(),c);return{id:Number(E.lastInsertRowid),createdAtEpoch:c}}markSessionCompleted(e){let t=new Date,s=t.getTime();this.db.prepare(`
      UPDATE sdk_sessions
      SET status = 'completed', completed_at = ?, completed_at_epoch = ?
      WHERE id = ?
    `).run(t.toISOString(),s,e)}markSessionFailed(e){let t=new Date,s=t.getTime();this.db.prepare(`
      UPDATE sdk_sessions
      SET status = 'failed', completed_at = ?, completed_at_epoch = ?
      WHERE id = ?
    `).run(t.toISOString(),s,e)}getSessionSummariesByIds(e,t={}){if(e.length===0)return[];let{orderBy:s="date_desc",limit:r,project:o}=t,i=s==="date_asc"?"ASC":"DESC",c=r?`LIMIT ${r}`:"",p=e.map(()=>"?").join(","),l=[...e],_=o?`WHERE id IN (${p}) AND project = ?`:`WHERE id IN (${p})`;return o&&l.push(o),this.db.prepare(`
      SELECT * FROM session_summaries
      ${_}
      ORDER BY created_at_epoch ${i}
      ${c}
    `).all(...l)}getUserPromptsByIds(e,t={}){if(e.length===0)return[];let{orderBy:s="date_desc",limit:r,project:o}=t,i=s==="date_asc"?"ASC":"DESC",c=r?`LIMIT ${r}`:"",p=e.map(()=>"?").join(","),l=[...e],_=o?"AND s.project = ?":"";return o&&l.push(o),this.db.prepare(`
      SELECT
        up.*,
        s.project,
        s.sdk_session_id
      FROM user_prompts up
      JOIN sdk_sessions s ON up.claude_session_id = s.claude_session_id
      WHERE up.id IN (${p}) ${_}
      ORDER BY up.created_at_epoch ${i}
      ${c}
    `).all(...l)}getTimelineAroundTimestamp(e,t=10,s=10,r){return this.getTimelineAroundObservation(null,e,t,s,r)}getTimelineAroundObservation(e,t,s=10,r=10,o){let i=o?"AND project = ?":"",c=o?[o]:[],p,l;if(e!==null){let g=`
        SELECT id, created_at_epoch
        FROM observations
        WHERE id <= ? ${i}
        ORDER BY id DESC
        LIMIT ?
      `,A=`
        SELECT id, created_at_epoch
        FROM observations
        WHERE id >= ? ${i}
        ORDER BY id ASC
        LIMIT ?
      `;try{let T=this.db.prepare(g).all(e,...c,s+1),n=this.db.prepare(A).all(e,...c,r+1);if(T.length===0&&n.length===0)return{observations:[],sessions:[],prompts:[]};p=T.length>0?T[T.length-1].created_at_epoch:t,l=n.length>0?n[n.length-1].created_at_epoch:t}catch(T){return console.error("[SessionStore] Error getting boundary observations:",T.message,o?`(project: ${o})`:"(all projects)"),{observations:[],sessions:[],prompts:[]}}}else{let g=`
        SELECT created_at_epoch
        FROM observations
        WHERE created_at_epoch <= ? ${i}
        ORDER BY created_at_epoch DESC
        LIMIT ?
      `,A=`
        SELECT created_at_epoch
        FROM observations
        WHERE created_at_epoch >= ? ${i}
        ORDER BY created_at_epoch ASC
        LIMIT ?
      `;try{let T=this.db.prepare(g).all(t,...c,s),n=this.db.prepare(A).all(t,...c,r+1);if(T.length===0&&n.length===0)return{observations:[],sessions:[],prompts:[]};p=T.length>0?T[T.length-1].created_at_epoch:t,l=n.length>0?n[n.length-1].created_at_epoch:t}catch(T){return console.error("[SessionStore] Error getting boundary timestamps:",T.message,o?`(project: ${o})`:"(all projects)"),{observations:[],sessions:[],prompts:[]}}}let _=`
      SELECT *
      FROM observations
      WHERE created_at_epoch >= ? AND created_at_epoch <= ? ${i}
      ORDER BY created_at_epoch ASC
    `,E=`
      SELECT *
      FROM session_summaries
      WHERE created_at_epoch >= ? AND created_at_epoch <= ? ${i}
      ORDER BY created_at_epoch ASC
    `,O=`
      SELECT up.*, s.project, s.sdk_session_id
      FROM user_prompts up
      JOIN sdk_sessions s ON up.claude_session_id = s.claude_session_id
      WHERE up.created_at_epoch >= ? AND up.created_at_epoch <= ? ${i.replace("project","s.project")}
      ORDER BY up.created_at_epoch ASC
    `;try{let g=this.db.prepare(_).all(p,l,...c),A=this.db.prepare(E).all(p,l,...c),T=this.db.prepare(O).all(p,l,...c);return{observations:g,sessions:A.map(n=>({id:n.id,sdk_session_id:n.sdk_session_id,project:n.project,request:n.request,completed:n.completed,next_steps:n.next_steps,created_at:n.created_at,created_at_epoch:n.created_at_epoch})),prompts:T.map(n=>({id:n.id,claude_session_id:n.claude_session_id,prompt_number:n.prompt_number,prompt_text:n.prompt_text,project:n.project,created_at:n.created_at,created_at_epoch:n.created_at_epoch}))}}catch(g){return console.error("[SessionStore] Error querying timeline records:",g.message,o?`(project: ${o})`:"(all projects)"),{observations:[],sessions:[],prompts:[]}}}getPromptById(e){return this.db.prepare(`
      SELECT
        p.id,
        p.claude_session_id,
        p.prompt_number,
        p.prompt_text,
        s.project,
        p.created_at,
        p.created_at_epoch
      FROM user_prompts p
      LEFT JOIN sdk_sessions s ON p.claude_session_id = s.claude_session_id
      WHERE p.id = ?
      LIMIT 1
    `).get(e)||null}getPromptsByIds(e){if(e.length===0)return[];let t=e.map(()=>"?").join(",");return this.db.prepare(`
      SELECT
        p.id,
        p.claude_session_id,
        p.prompt_number,
        p.prompt_text,
        s.project,
        p.created_at,
        p.created_at_epoch
      FROM user_prompts p
      LEFT JOIN sdk_sessions s ON p.claude_session_id = s.claude_session_id
      WHERE p.id IN (${t})
      ORDER BY p.created_at_epoch DESC
    `).all(...e)}getSessionSummaryById(e){return this.db.prepare(`
      SELECT
        id,
        sdk_session_id,
        claude_session_id,
        project,
        user_prompt,
        request_summary,
        learned_summary,
        status,
        created_at,
        created_at_epoch
      FROM sdk_sessions
      WHERE id = ?
      LIMIT 1
    `).get(e)||null}close(){this.db.close()}importSdkSession(e){let t=this.db.prepare("SELECT id FROM sdk_sessions WHERE claude_session_id = ?").get(e.claude_session_id);return t?{imported:!1,id:t.id}:{imported:!0,id:this.db.prepare(`
      INSERT INTO sdk_sessions (
        claude_session_id, sdk_session_id, project, user_prompt,
        started_at, started_at_epoch, completed_at, completed_at_epoch, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(e.claude_session_id,e.sdk_session_id,e.project,e.user_prompt,e.started_at,e.started_at_epoch,e.completed_at,e.completed_at_epoch,e.status).lastInsertRowid}}importSessionSummary(e){let t=this.db.prepare("SELECT id FROM session_summaries WHERE sdk_session_id = ?").get(e.sdk_session_id);return t?{imported:!1,id:t.id}:{imported:!0,id:this.db.prepare(`
      INSERT INTO session_summaries (
        sdk_session_id, project, request, investigated, learned,
        completed, next_steps, files_read, files_edited, notes,
        prompt_number, discovery_tokens, created_at, created_at_epoch
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(e.sdk_session_id,e.project,e.request,e.investigated,e.learned,e.completed,e.next_steps,e.files_read,e.files_edited,e.notes,e.prompt_number,e.discovery_tokens||0,e.created_at,e.created_at_epoch).lastInsertRowid}}importObservation(e){let t=this.db.prepare(`
      SELECT id FROM observations
      WHERE sdk_session_id = ? AND title = ? AND created_at_epoch = ?
    `).get(e.sdk_session_id,e.title,e.created_at_epoch);return t?{imported:!1,id:t.id}:{imported:!0,id:this.db.prepare(`
      INSERT INTO observations (
        sdk_session_id, project, text, type, title, subtitle,
        facts, narrative, concepts, files_read, files_modified,
        prompt_number, discovery_tokens, created_at, created_at_epoch
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(e.sdk_session_id,e.project,e.text,e.type,e.title,e.subtitle,e.facts,e.narrative,e.concepts,e.files_read,e.files_modified,e.prompt_number,e.discovery_tokens||0,e.created_at,e.created_at_epoch).lastInsertRowid}}importUserPrompt(e){let t=this.db.prepare(`
      SELECT id FROM user_prompts
      WHERE claude_session_id = ? AND prompt_number = ?
    `).get(e.claude_session_id,e.prompt_number);return t?{imported:!1,id:t.id}:{imported:!0,id:this.db.prepare(`
      INSERT INTO user_prompts (
        claude_session_id, prompt_number, prompt_text,
        created_at, created_at_epoch
      ) VALUES (?, ?, ?, ?, ?)
    `).run(e.claude_session_id,e.prompt_number,e.prompt_text,e.created_at,e.created_at_epoch).lastInsertRowid}}};var Oe=me(require("path"),1);function Re(d){if(!d)return[];try{let e=JSON.parse(d);return Array.isArray(e)?e:[]}catch{return[]}}function Be(d){return new Date(d).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit",hour12:!0})}function Ve(d){return new Date(d).toLocaleString("en-US",{hour:"numeric",minute:"2-digit",hour12:!0})}function Ye(d){return new Date(d).toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric"})}function Tt(d,e){return Oe.default.isAbsolute(d)?Oe.default.relative(e,d):d}function Ke(d,e){let t=Re(d);return t.length>0?Tt(t[0],e):"General"}var qe=me(require("path"),1);function Je(d){if(!d||d.trim()==="")return h.warn("PROJECT_NAME","Empty cwd provided, using fallback",{cwd:d}),"unknown-project";let e=qe.default.basename(d);if(e===""){if(process.platform==="win32"){let s=d.match(/^([A-Z]):\\/i);if(s){let o=`drive-${s[1].toUpperCase()}`;return h.info("PROJECT_NAME","Drive root detected",{cwd:d,projectName:o}),o}}return h.warn("PROJECT_NAME","Root directory detected, using fallback",{cwd:d}),"unknown-project"}return e}var z=require("fs"),ae=require("path");var q=class d{static instance=null;activeMode=null;modesDir;constructor(){let e=He(),t=[(0,ae.join)(e,"modes"),(0,ae.join)(e,"..","plugin","modes")],s=t.find(r=>(0,z.existsSync)(r));this.modesDir=s||t[0]}static getInstance(){return d.instance||(d.instance=new d),d.instance}parseInheritance(e){let t=e.split("--");if(t.length===1)return{hasParent:!1,parentId:"",overrideId:""};if(t.length>2)throw new Error(`Invalid mode inheritance: ${e}. Only one level of inheritance supported (parent--override)`);return{hasParent:!0,parentId:t[0],overrideId:e}}isPlainObject(e){return e!==null&&typeof e=="object"&&!Array.isArray(e)}deepMerge(e,t){let s={...e};for(let r in t){let o=t[r],i=e[r];this.isPlainObject(o)&&this.isPlainObject(i)?s[r]=this.deepMerge(i,o):s[r]=o}return s}loadModeFile(e){let t=(0,ae.join)(this.modesDir,`${e}.json`);if(!(0,z.existsSync)(t))throw new Error(`Mode file not found: ${t}`);let s=(0,z.readFileSync)(t,"utf-8");return JSON.parse(s)}loadMode(e){let t=this.parseInheritance(e);if(!t.hasParent)try{let p=this.loadModeFile(e);return this.activeMode=p,h.debug("SYSTEM",`Loaded mode: ${p.name} (${e})`,void 0,{types:p.observation_types.map(l=>l.id),concepts:p.observation_concepts.map(l=>l.id)}),p}catch{if(h.warn("SYSTEM",`Mode file not found: ${e}, falling back to 'code'`),e==="code")throw new Error("Critical: code.json mode file missing");return this.loadMode("code")}let{parentId:s,overrideId:r}=t,o;try{o=this.loadMode(s)}catch{h.warn("SYSTEM",`Parent mode '${s}' not found for ${e}, falling back to 'code'`),o=this.loadMode("code")}let i;try{i=this.loadModeFile(r),h.debug("SYSTEM",`Loaded override file: ${r} for parent ${s}`)}catch{return h.warn("SYSTEM",`Override file '${r}' not found, using parent mode '${s}' only`),this.activeMode=o,o}if(!i)return h.warn("SYSTEM",`Invalid override file: ${r}, using parent mode '${s}' only`),this.activeMode=o,o;let c=this.deepMerge(o,i);return this.activeMode=c,h.debug("SYSTEM",`Loaded mode with inheritance: ${c.name} (${e} = ${s} + ${r})`,void 0,{parent:s,override:r,types:c.observation_types.map(p=>p.id),concepts:c.observation_concepts.map(p=>p.id)}),c}getActiveMode(){if(!this.activeMode)throw new Error("No mode loaded. Call loadMode() first.");return this.activeMode}getObservationTypes(){return this.getActiveMode().observation_types}getObservationConcepts(){return this.getActiveMode().observation_concepts}getTypeIcon(e){return this.getObservationTypes().find(s=>s.id===e)?.emoji||"\u{1F4DD}"}getWorkEmoji(e){return this.getObservationTypes().find(s=>s.id===e)?.work_emoji||"\u{1F4DD}"}validateType(e){return this.getObservationTypes().some(t=>t.id===e)}getTypeLabel(e){return this.getObservationTypes().find(s=>s.id===e)?.label||e}};var ht=ce.default.join((0,pe.homedir)(),".claude","plugins","marketplaces","thedotmack","plugin",".install-version");function ft(){let d=ce.default.join((0,pe.homedir)(),".claude-mem","settings.json"),e=U.loadFromFile(d);return{totalObservationCount:parseInt(e.CLAUDE_MEM_CONTEXT_OBSERVATIONS,10),fullObservationCount:parseInt(e.CLAUDE_MEM_CONTEXT_FULL_COUNT,10),sessionCount:parseInt(e.CLAUDE_MEM_CONTEXT_SESSION_COUNT,10),showReadTokens:e.CLAUDE_MEM_CONTEXT_SHOW_READ_TOKENS==="true",showWorkTokens:e.CLAUDE_MEM_CONTEXT_SHOW_WORK_TOKENS==="true",showSavingsAmount:e.CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_AMOUNT==="true",showSavingsPercent:e.CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_PERCENT==="true",observationTypes:new Set(e.CLAUDE_MEM_CONTEXT_OBSERVATION_TYPES.split(",").map(t=>t.trim()).filter(Boolean)),observationConcepts:new Set(e.CLAUDE_MEM_CONTEXT_OBSERVATION_CONCEPTS.split(",").map(t=>t.trim()).filter(Boolean)),fullObservationField:e.CLAUDE_MEM_CONTEXT_FULL_FIELD,showLastSummary:e.CLAUDE_MEM_CONTEXT_SHOW_LAST_SUMMARY==="true",showLastMessage:e.CLAUDE_MEM_CONTEXT_SHOW_LAST_MESSAGE==="true"}}var Qe=4,St=1,a={reset:"\x1B[0m",bright:"\x1B[1m",dim:"\x1B[2m",cyan:"\x1B[36m",green:"\x1B[32m",yellow:"\x1B[33m",blue:"\x1B[34m",magenta:"\x1B[35m",gray:"\x1B[90m",red:"\x1B[31m"};function de(d,e,t,s){return e?s?[`${t}${d}:${a.reset} ${e}`,""]:[`**${d}**: ${e}`,""]:[]}function bt(d){return d.replace(/\//g,"-")}function Ot(d){try{if(!(0,J.existsSync)(d))return{userMessage:"",assistantMessage:""};let e=(0,J.readFileSync)(d,"utf-8").trim();if(!e)return{userMessage:"",assistantMessage:""};let t=e.split(`
`).filter(r=>r.trim()),s="";for(let r=t.length-1;r>=0;r--)try{let o=t[r];if(!o.includes('"type":"assistant"'))continue;let i=JSON.parse(o);if(i.type==="assistant"&&i.message?.content&&Array.isArray(i.message.content)){let c="";for(let p of i.message.content)p.type==="text"&&(c+=p.text);if(c=c.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g,"").trim(),c){s=c;break}}}catch{continue}return{userMessage:"",assistantMessage:s}}catch(e){return h.failure("WORKER","Failed to extract prior messages from transcript",{transcriptPath:d},e),{userMessage:"",assistantMessage:""}}}async function Rt(d,e=!1){let t=ft(),s=d?.cwd??process.cwd(),r=Je(s),o=null;try{o=new ie}catch(I){if(I.code==="ERR_DLOPEN_FAILED"){try{(0,J.unlinkSync)(ht)}catch{}return console.error("Native module rebuild needed - restart Claude Code to auto-fix"),""}throw I}let i=Array.from(t.observationTypes),c=i.map(()=>"?").join(","),p=Array.from(t.observationConcepts),l=p.map(()=>"?").join(","),_=o.db.prepare(`
    SELECT
      id, sdk_session_id, type, title, subtitle, narrative,
      facts, concepts, files_read, files_modified, discovery_tokens,
      created_at, created_at_epoch
    FROM observations
    WHERE project = ?
      AND type IN (${c})
      AND EXISTS (
        SELECT 1 FROM json_each(concepts)
        WHERE value IN (${l})
      )
    ORDER BY created_at_epoch DESC
    LIMIT ?
  `).all(r,...i,...p,t.totalObservationCount),E=o.db.prepare(`
    SELECT id, sdk_session_id, request, investigated, learned, completed, next_steps, created_at, created_at_epoch
    FROM session_summaries
    WHERE project = ?
    ORDER BY created_at_epoch DESC
    LIMIT ?
  `).all(r,t.sessionCount+St),O="",g="";if(t.showLastMessage&&_.length>0){let I=d?.session_id,R=_.find(k=>k.sdk_session_id!==I);if(R){let k=R.sdk_session_id,w=bt(s),N=ce.default.join((0,pe.homedir)(),".claude","projects",w,`${k}.jsonl`),y=Ot(N);O=y.userMessage,g=y.assistantMessage}}if(_.length===0&&E.length===0)return o?.close(),e?`
${a.bright}${a.cyan}[${r}] recent context${a.reset}
${a.gray}${"\u2500".repeat(60)}${a.reset}

${a.dim}No previous sessions found for this project yet.${a.reset}
`:`# [${r}] recent context

No previous sessions found for this project yet.`;let A=E.slice(0,t.sessionCount),T=_,n=[];if(e?(n.push(""),n.push(`${a.bright}${a.cyan}[${r}] recent context${a.reset}`),n.push(`${a.gray}${"\u2500".repeat(60)}${a.reset}`),n.push("")):(n.push(`# [${r}] recent context`),n.push("")),T.length>0){let R=q.getInstance().getActiveMode().observation_types.map(u=>`${u.emoji} ${u.id}`).join(" | ");e?n.push(`${a.dim}Legend: \u{1F3AF} session-request | ${R}${a.reset}`):n.push(`**Legend:** \u{1F3AF} session-request | ${R}`),n.push(""),e?(n.push(`${a.bright}\u{1F4A1} Column Key${a.reset}`),n.push(`${a.dim}  Read: Tokens to read this observation (cost to learn it now)${a.reset}`),n.push(`${a.dim}  Work: Tokens spent on work that produced this record (\u{1F50D} research, \u{1F6E0}\uFE0F building, \u2696\uFE0F  deciding)${a.reset}`)):(n.push("\u{1F4A1} **Column Key**:"),n.push("- **Read**: Tokens to read this observation (cost to learn it now)"),n.push("- **Work**: Tokens spent on work that produced this record (\u{1F50D} research, \u{1F6E0}\uFE0F building, \u2696\uFE0F  deciding)")),n.push(""),e?(n.push(`${a.dim}\u{1F4A1} Context Index: This semantic index (titles, types, files, tokens) is usually sufficient to understand past work.${a.reset}`),n.push(""),n.push(`${a.dim}When you need implementation details, rationale, or debugging context:${a.reset}`),n.push(`${a.dim}  - Use the mem-search skill to fetch full observations on-demand${a.reset}`),n.push(`${a.dim}  - Critical types (\u{1F534} bugfix, \u2696\uFE0F decision) often need detailed fetching${a.reset}`),n.push(`${a.dim}  - Trust this index over re-reading code for past decisions and learnings${a.reset}`)):(n.push("\u{1F4A1} **Context Index:** This semantic index (titles, types, files, tokens) is usually sufficient to understand past work."),n.push(""),n.push("When you need implementation details, rationale, or debugging context:"),n.push("- Use the mem-search skill to fetch full observations on-demand"),n.push("- Critical types (\u{1F534} bugfix, \u2696\uFE0F decision) often need detailed fetching"),n.push("- Trust this index over re-reading code for past decisions and learnings")),n.push("");let k=_.length,w=_.reduce((u,f)=>{let S=(f.title?.length||0)+(f.subtitle?.length||0)+(f.narrative?.length||0)+JSON.stringify(f.facts||[]).length;return u+Math.ceil(S/Qe)},0),N=_.reduce((u,f)=>u+(f.discovery_tokens||0),0),y=N-w,Z=N>0?Math.round(y/N*100):0,Ne=t.showReadTokens||t.showWorkTokens||t.showSavingsAmount||t.showSavingsPercent;if(Ne)if(e){if(n.push(`${a.bright}${a.cyan}\u{1F4CA} Context Economics${a.reset}`),n.push(`${a.dim}  Loading: ${k} observations (${w.toLocaleString()} tokens to read)${a.reset}`),n.push(`${a.dim}  Work investment: ${N.toLocaleString()} tokens spent on research, building, and decisions${a.reset}`),N>0&&(t.showSavingsAmount||t.showSavingsPercent)){let u="  Your savings: ";t.showSavingsAmount&&t.showSavingsPercent?u+=`${y.toLocaleString()} tokens (${Z}% reduction from reuse)`:t.showSavingsAmount?u+=`${y.toLocaleString()} tokens`:u+=`${Z}% reduction from reuse`,n.push(`${a.green}${u}${a.reset}`)}n.push("")}else{if(n.push("\u{1F4CA} **Context Economics**:"),n.push(`- Loading: ${k} observations (${w.toLocaleString()} tokens to read)`),n.push(`- Work investment: ${N.toLocaleString()} tokens spent on research, building, and decisions`),N>0&&(t.showSavingsAmount||t.showSavingsPercent)){let u="- Your savings: ";t.showSavingsAmount&&t.showSavingsPercent?u+=`${y.toLocaleString()} tokens (${Z}% reduction from reuse)`:t.showSavingsAmount?u+=`${y.toLocaleString()} tokens`:u+=`${Z}% reduction from reuse`,n.push(u)}n.push("")}let ze=E[0]?.id,Ze=A.map((u,f)=>{let S=f===0?null:E[f+1];return{...u,displayEpoch:S?S.created_at_epoch:u.created_at_epoch,displayTime:S?S.created_at:u.created_at,shouldShowLink:u.id!==ze}}),et=new Set(_.slice(0,t.fullObservationCount).map(u=>u.id)),Ae=[...T.map(u=>({type:"observation",data:u})),...Ze.map(u=>({type:"summary",data:u}))];Ae.sort((u,f)=>{let S=u.type==="observation"?u.data.created_at_epoch:u.data.displayEpoch,x=f.type==="observation"?f.data.created_at_epoch:f.data.displayEpoch;return S-x});let ee=new Map;for(let u of Ae){let f=u.type==="observation"?u.data.created_at:u.data.displayTime,S=Ye(f);ee.has(S)||ee.set(S,[]),ee.get(S).push(u)}let tt=Array.from(ee.entries()).sort((u,f)=>{let S=new Date(u[0]).getTime(),x=new Date(f[0]).getTime();return S-x});for(let[u,f]of tt){e?(n.push(`${a.bright}${a.cyan}${u}${a.reset}`),n.push("")):(n.push(`### ${u}`),n.push(""));let S=null,x="",P=!1;for(let ue of f)if(ue.type==="summary"){P&&(n.push(""),P=!1,S=null,x="");let m=ue.data,F=`${m.request||"Session started"} (${Be(m.displayTime)})`;e?n.push(`\u{1F3AF} ${a.yellow}#S${m.id}${a.reset} ${F}`):n.push(`**\u{1F3AF} #S${m.id}** ${F}`),n.push("")}else{let m=ue.data,F=Ke(m.files_modified,s);F!==S&&(P&&n.push(""),e?n.push(`${a.dim}${F}${a.reset}`):n.push(`**${F}**`),e||(n.push("| ID | Time | T | Title | Read | Work |"),n.push("|----|------|---|-------|------|------|")),S=F,P=!0,x="");let j=Ve(m.created_at),te=m.title||"Untitled",se=q.getInstance().getTypeIcon(m.type),st=(m.title?.length||0)+(m.subtitle?.length||0)+(m.narrative?.length||0)+JSON.stringify(m.facts||[]).length,X=Math.ceil(st/Qe),H=m.discovery_tokens||0,le=q.getInstance().getWorkEmoji(m.type),Ce=H>0?`${le} ${H.toLocaleString()}`:"-",_e=j!==x,Le=_e?j:"";if(x=j,et.has(m.id)){let $=t.fullObservationField==="narrative"?m.narrative:m.facts?Re(m.facts).join(`
`):null;if(e){let L=_e?`${a.dim}${j}${a.reset}`:" ".repeat(j.length),re=t.showReadTokens&&X>0?`${a.dim}(~${X}t)${a.reset}`:"",De=t.showWorkTokens&&H>0?`${a.dim}(${le} ${H.toLocaleString()}t)${a.reset}`:"";n.push(`  ${a.dim}#${m.id}${a.reset}  ${L}  ${se}  ${a.bright}${te}${a.reset}`),$&&n.push(`    ${a.dim}${$}${a.reset}`),(re||De)&&n.push(`    ${re} ${De}`),n.push("")}else{P&&(n.push(""),P=!1),n.push(`**#${m.id}** ${Le||"\u2033"} ${se} **${te}**`),$&&(n.push(""),n.push($),n.push(""));let L=[];t.showReadTokens&&L.push(`Read: ~${X}`),t.showWorkTokens&&L.push(`Work: ${Ce}`),L.length>0&&n.push(L.join(", ")),n.push(""),S=null}}else if(e){let $=_e?`${a.dim}${j}${a.reset}`:" ".repeat(j.length),L=t.showReadTokens&&X>0?`${a.dim}(~${X}t)${a.reset}`:"",re=t.showWorkTokens&&H>0?`${a.dim}(${le} ${H.toLocaleString()}t)${a.reset}`:"";n.push(`  ${a.dim}#${m.id}${a.reset}  ${$}  ${se}  ${te} ${L} ${re}`)}else{let $=t.showReadTokens?`~${X}`:"",L=t.showWorkTokens?Ce:"";n.push(`| #${m.id} | ${Le||"\u2033"} | ${se} | ${te} | ${$} | ${L} |`)}}P&&n.push("")}let C=E[0],Ie=_[0];if(t.showLastSummary&&C&&(C.investigated||C.learned||C.completed||C.next_steps)&&(!Ie||C.created_at_epoch>Ie.created_at_epoch)&&(n.push(...de("Investigated",C.investigated,a.blue,e)),n.push(...de("Learned",C.learned,a.yellow,e)),n.push(...de("Completed",C.completed,a.green,e)),n.push(...de("Next Steps",C.next_steps,a.magenta,e))),g&&(n.push(""),n.push("---"),n.push(""),e?(n.push(`${a.bright}${a.magenta}\u{1F4CB} Previously${a.reset}`),n.push(""),n.push(`${a.dim}A: ${g}${a.reset}`)):(n.push("**\u{1F4CB} Previously**"),n.push(""),n.push(`A: ${g}`)),n.push("")),Ne&&N>0&&y>0){let u=Math.round(N/1e3);n.push(""),e?n.push(`${a.dim}\u{1F4B0} Access ${u}k tokens of past research & decisions for just ${w.toLocaleString()}t. Use the mem-search skill to access memories by ID instead of re-reading files.${a.reset}`):n.push(`\u{1F4B0} Access ${u}k tokens of past research & decisions for just ${w.toLocaleString()}t. Use the mem-search skill to access memories by ID instead of re-reading files.`)}}return o?.close(),n.join(`
`).trimEnd()}0&&(module.exports={generateContext});
