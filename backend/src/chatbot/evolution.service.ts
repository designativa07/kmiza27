import { Injectable } from '@nestjs/common';

@Injectable()
export class EvolutionService {
  private readonly evolutionUrl = 'https://kmiza27-evolution.h4xd66.easypanel.host';
  private readonly apiKey = 'DEEFCBB25D74-4E46-BE91-CA7852798094';
  private readonly instanceName = 'Kmiza27';

  async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.evolutionUrl}/message/sendText/${this.instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey,
        },
        body: JSON.stringify({
          number: phoneNumber,
          text: message,
        }),
      });

      if (response.ok) {
        console.log(`✅ Mensagem enviada para ${phoneNumber}`);
        return true;
      } else {
        console.error(`❌ Erro ao enviar mensagem: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro na Evolution API:', error);
      return false;
    }
  }

  async getInstanceStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.evolutionUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const instance = data.find((inst: any) => inst.instanceName === this.instanceName);
        
        return {
          instance: {
            instanceName: this.instanceName,
            state: instance?.state || 'unknown'
          }
        };
      } else {
        return {
          instance: {
            instanceName: this.instanceName,
            state: 'error'
          }
        };
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status da instância:', error);
      return {
        instance: {
          instanceName: this.instanceName,
          state: 'error'
        }
      };
    }
  }
} 