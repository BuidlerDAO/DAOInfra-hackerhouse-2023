import { AutoEngine } from '../scriptEngine/AutoEngine';
import { NetworkCenter } from '../scriptEngine/NetworkCenter';
import { ScriptChecker } from '../scriptEngine/ScriptChecker';
import { Converter } from '../scriptEngine/Converter';

const scriptInfo = {}

const networkCenter = new NetworkCenter();

const autoEngine = new AutoEngine(scriptInfo, networkCenter, null);

