FROM holochain/holonix:ubuntu

# this basically initialzie holochain for the default user (docker)
RUN curl https://nixos.org/nix/install | sh
RUN echo ". /home/docker/.nix-profile/etc/profile.d/nix.sh" >> /home/docker/.bashrc

VOLUME ["/holochain"]
WORKDIR /holochain

EXPOSE 8888

# Keep container up and running
CMD . /home/docker/.nix-profile/etc/profile.d/nix.sh && tail -f /dev/null
