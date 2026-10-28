import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    try {
      const roles = await strapi.db.query('plugin::users-permissions.role').findMany({
        populate: ['permissions'],
      });

      const authenticatedRole = roles.find((r: any) => r.type === 'authenticated');
      const publicRole = roles.find((r: any) => r.type === 'public');

      const authenticatedActions = [
        'api::product.product.find',
        'api::product.product.findOne',
        'api::product.product.create',
        'api::product.product.update',
        'api::product.product.delete',
        'api::category.category.find',
        'api::category.category.findOne',
        'plugin::upload.content-api.upload',
        'plugin::upload.content-api.find',
        'plugin::upload.content-api.findOne',
        'plugin::upload.content-api.destroy',
      ];

      const publicActions = [
        'api::product.product.find',
        'api::product.product.findOne',
        'api::category.category.find',
        'api::category.category.findOne',
        'plugin::upload.content-api.find',
        'plugin::upload.content-api.findOne',
      ];

      const grantPermissions = async (role: any, actions: string[]) => {
        if (!role) return;
        const existingPermissions = await strapi.db
          .query('plugin::users-permissions.permission')
          .findMany({
            where: {
              role: role.id,
            },
          });

        const existingActions = new Set(existingPermissions.map((p: any) => p.action));

        for (const action of actions) {
          if (!existingActions.has(action)) {
            await strapi.db.query('plugin::users-permissions.permission').create({
              data: {
                action,
                role: role.id,
              },
            });
            strapi.log.info(`[Bootstrap] Granted permission '${action}' to role '${role.name}'`);
          }
        }
      };

      if (authenticatedRole) {
        await grantPermissions(authenticatedRole, authenticatedActions);
      }
      if (publicRole) {
        await grantPermissions(publicRole, publicActions);
      }
    } catch (error) {
      strapi.log.error('[Bootstrap] Error configuring permissions:', error);
    }
  },
};

